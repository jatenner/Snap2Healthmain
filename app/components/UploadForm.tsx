'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../context/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Define the ApiResponse type used in the component
type ApiResponse = {
  success: boolean;
  analysisId?: string;
  mealName?: string;
  error?: string;
  message?: string;
  supabaseStorage?: boolean;
  authenticated?: boolean;
  userId?: string;
};

// Update the type definition to include 'error' state
type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [goal, setGoal] = useState<string>('Athletic Performance');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ApiResponse | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use the enhanced useAuth hook's values directly
        if (!loading) {
          if (user?.id) {
            setAuthStatus('authenticated');
            setUserId(user.id);
            console.log('[UploadForm] User is authenticated from useAuth:', user.id);
            
            // Set auth data in localStorage for redundancy
            localStorage.setItem('auth_login_timestamp', Date.now().toString());
            localStorage.setItem('auth_user_id', user.id);
            
            return;
          } else {
            // If useAuth says we're not authenticated, double check with direct Supabase call
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
              // Found a valid session
              setAuthStatus('authenticated');
              setUserId(session.user.id);
              console.log('[UploadForm] Found session via direct Supabase check:', session.user.id);
              
              // Set auth data in localStorage for redundancy
              localStorage.setItem('auth_login_timestamp', Date.now().toString());
              localStorage.setItem('auth_user_id', session.user.id);
              
              return;
            }
            
            // Still not authenticated, make a last check with the API
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            
            if (data.authenticated && data.userId) {
              setAuthStatus('authenticated');
              setUserId(data.userId);
              console.log('[UploadForm] Found user via API check:', data.userId);
              
              // Set auth data in localStorage for redundancy
              localStorage.setItem('auth_login_timestamp', Date.now().toString());
              localStorage.setItem('auth_user_id', data.userId);
              
              return;
            }
            
            // Try to get the access token directly from localStorage, it might still be valid
            try {
              const sbAccessToken = localStorage.getItem('supabase.auth.token');
              if (sbAccessToken) {
                console.log('[UploadForm] Found access token in localStorage, refreshing session');
                const { data: refreshData } = await supabase.auth.refreshSession();
                
                if (refreshData.session?.user) {
                  setAuthStatus('authenticated');
                  setUserId(refreshData.session.user.id);
                  console.log('[UploadForm] Refreshed session successfully:', refreshData.session.user.id);
                  return;
                }
              }
            } catch (tokenError) {
              console.log('[UploadForm] Error refreshing token:', tokenError);
            }
            
            // No authentication found - we're in anonymous mode
            console.log('[UploadForm] No authentication detected, using anonymous mode');
            setAuthStatus('anonymous');
            setUserId(null);
          }
        }
      } catch (error) {
        console.error('[UploadForm] Error checking authentication:', error);
        setAuthStatus('error');
      }
    };

    checkAuth();
  }, [user, loading, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Validate file type
    const validTypes = [
      'image/jpeg', 
      'image/jpg',
      'image/png', 
      'image/webp', 
      'image/heic', 
      'image/heif',
      'image/bmp',
      'image/tiff',
      'image/tif',
      'image/gif',
      'image/avif'
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Please select a valid image file. Supported: JPEG, PNG, WEBP, HEIC, BMP, TIFF, GIF, AVIF. Your file type: ${selectedFile.type || 'unknown'}`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Clean up preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image to upload');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', goal);
      
      // Double-check authentication status before submission
      let effectiveUserId = userId;
      let effectiveAuthStatus = authStatus;
      
      if (!effectiveUserId || authStatus !== 'authenticated') {
        // Make one last attempt to get authentication status
        console.log('[UploadForm] Performing last-minute auth check before submission');
        try {
          // Direct Supabase check
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            effectiveUserId = session.user.id;
            effectiveAuthStatus = 'authenticated';
            console.log('[UploadForm] Last-minute auth check found session:', session.user.id);
          }
        } catch (lastAuthError) {
          console.error('[UploadForm] Last-minute auth check failed:', lastAuthError);
        }
      }
      
      // Add authentication info to form data
      if (effectiveAuthStatus === 'authenticated' && effectiveUserId) {
        formData.append('userId', effectiveUserId);
        formData.append('isAuthenticated', 'true');
        formData.append('authTimestamp', Date.now().toString());
        
        // Log auth status for debugging
        console.log('[UploadForm] Submitting WITH authentication:', {
          userId: effectiveUserId,
          authStatus: effectiveAuthStatus
        });
      } else {
        console.log('[UploadForm] Submitting WITHOUT authentication - user will be anonymous');
      }
      
      // Create headers with explicit authentication info
      const headers = new Headers();
      
      // If we have authentication info, add it to headers as well
      if (effectiveAuthStatus === 'authenticated' && effectiveUserId) {
        headers.set('x-auth-user-id', effectiveUserId);
        headers.set('x-authenticated', 'true');
      }
      
      // Enhanced fetch with explicit headers
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies
        headers: headers
      });
      
      if (!response.ok) {
        let errorText = await response.text();
        let errorData: any = null;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If not parseable, use the text as is
        }
        
        const errorMessage = errorData?.error || errorData?.message || errorText || response.statusText || 'Unknown error';
        throw new Error(`Failed to upload: ${errorMessage}`);
      }
      
      // Process the response
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        console.log('[UploadForm] Upload successful, analysis ID:', data.analysisId);
        setProgress(100);
        
        // Confirm in the console if the image was properly stored
        console.log('[UploadForm] Supabase storage successful:', data.supabaseStorage);
        console.log('[UploadForm] User authenticated for storage:', data.authenticated || false);
        
        // Check if user ID matches expected user ID
        if (data.userId && effectiveUserId && data.userId !== effectiveUserId) {
          console.warn('[UploadForm] User ID mismatch! Expected:', effectiveUserId, 'Got:', data.userId);
        }
        
        // Set the result and redirect
        setResult(data);
        
        // Save the analysis ID to localStorage to be able to retrieve it later if needed
        if (data.analysisId) {
          localStorage.setItem('current_meal_id', data.analysisId);
          
          // Set a cookie as backup
          document.cookie = `last_uploaded_meal_id=${data.analysisId}; path=/; max-age=3600`;
          
          // Redirect to the analysis page
          router.push(`/meal-analysis?id=${data.analysisId}`);
        } else {
          setError('No analysis ID returned from server');
        }
      } else {
        // Handle API response with error
        const errorMessage = data.error || 'Unknown error during meal analysis';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('[UploadForm] Error:', err);
      
      // Provide specific error messages for different types of failures
      if (err instanceof Error) {
        if (err.message.includes('OpenAI') || err.message.includes('analysis service')) {
          setError(`AI Analysis Failed: ${err.message}. We cannot provide nutritional analysis without a successful AI response. Please try again with a clear photo of your food.`);
        } else if (err.message.includes('Unable to analyze')) {
          setError(`Analysis Unavailable: ${err.message}. No nutritional data will be shown without successful AI analysis.`);
        } else {
          setError(`Upload Failed: ${err.message}`);
        }
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* Authentication status banner - show confirmation of login, not warning */}
      {authStatus === 'authenticated' && (
        <div className="bg-green-900/20 text-green-200 border-green-800 p-4 rounded-lg">
          <p className="flex items-start mobile-text">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            Logged in successfully. Your meal will be saved to your history.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="goal">Nutritional Goal</Label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="General Wellness">General Wellness</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Athletic Performance">Athletic Performance</option>
            <option value="Heart Health">Heart Health</option>
            <option value="Diabetes Management">Diabetes Management</option>
          </select>
          <p className="text-sm text-gray-400">
            This helps us provide more relevant nutritional feedback
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">Food Image</Label>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${previewUrl ? 'border-blue-500 bg-blue-950/20' : 'border-gray-600 hover:border-gray-500 bg-gray-900/20 hover:bg-gray-800/20'}`}
            onClick={triggerFileInput}
          >
            <input
              id="image"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/bmp,image/tiff,image/tif,image/gif,image/avif"
              className="hidden"
              disabled={isSubmitting}
            />
            
            {previewUrl ? (
              <div className="relative aspect-video w-full max-h-80 mx-auto overflow-hidden rounded-md">
                <Image
                  src={previewUrl}
                  alt="Food preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="mx-auto"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-300 font-medium">Click to select an image</p>
                <p className="text-sm text-gray-500 mt-1">
                  JPEG, PNG, WEBP, HEIC, BMP, TIFF, GIF, AVIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/20 text-red-200 border-red-800 p-4 rounded-lg mobile-error">
            <p className="flex items-start mobile-text">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /><span>
              {error}</span>
            </p>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="bg-green-900/20 text-green-200 border-green-800 p-4 rounded-lg">
            <p className="flex items-start mobile-text">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Image uploaded successfully! Redirecting to analysis...
            </p>
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!file || isSubmitting || uploadSuccess}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing meal & generating AI insights...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Analyze Meal
            </>
          )}
        </Button>
      </form>
    </div>
  );
} 