'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import { useProfile } from '../lib/profile-context';
import Image from 'next/image';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FoodUpload from '../components/FoodUpload';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealSpecificGoal, setMealSpecificGoal] = useState('');
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [show502Recovery, setShow502Recovery] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsUsingCamera(true);
      setError('');
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
      }
    };

  const capturePhoto = () => {
    if (!stream) return;

    const video = document.querySelector('video');
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsUsingCamera(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', selectedFile);
      if (mealSpecificGoal) {
        analyzeFormData.append('goal', mealSpecificGoal);
      } else if (profile?.goal) {
        analyzeFormData.append('goal', profile.goal);
      }

      console.log('[Upload] Making request to /api/analyze-meal-base64');
      console.log('[Upload] FormData contents:', {
        hasFile: analyzeFormData.has('file'),
        hasGoal: analyzeFormData.has('goal'),
        goal: analyzeFormData.get('goal')
      });

      const analyzeResponse = await fetch('/api/analyze-meal-base64?debug=1', {
        method: 'POST',
        body: analyzeFormData,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      console.log('[Upload] Response status:', analyzeResponse.status);
      console.log('[Upload] Response headers:', Object.fromEntries(analyzeResponse.headers.entries()));

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error('[Upload] Error response body:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        let errorMessage = errorData.error || `Analysis failed: ${analyzeResponse.status}`;
        
        // Handle specific error cases with better user messaging
        if (analyzeResponse.status === 502) {
          errorMessage = 'Server temporarily unavailable - your analysis may still be processing in the background';
        } else if (analyzeResponse.status === 504) {
          errorMessage = 'Analysis is taking longer than expected - please try again with a smaller image';
        } else if (analyzeResponse.status === 422) {
          errorMessage = errorData.error || 'The image could not be analyzed - please try a different image';
        } else if (analyzeResponse.status >= 500) {
          errorMessage = 'Server error - please try again in a few moments';
        }
        console.error('[Upload] Parsed error:', errorData);
        
        throw new Error(errorMessage);
      }

      const result = await analyzeResponse.json();
    
      if (result.success && result.mealId) {
        router.push(`/analysis/${result.mealId}`);
      } else {
        throw new Error(result.error || 'Analysis failed');
    }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze meal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMealSpecificGoal('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Analyze Your Meal
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Take a photo or upload an image of your meal for AI analysis
            </p>
            
            {/* Goal Input Section - Always Visible */}
            <Card className="bg-gray-800 border-gray-700 max-w-md mx-auto mb-6">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-goal" className="text-gray-200 text-sm font-medium">
                    Analysis Goal
                  </Label>
                  <Input
                    id="primary-goal"
                    value={mealSpecificGoal}
                    onChange={(e) => setMealSpecificGoal(e.target.value)}
                    placeholder={profile?.goal || "e.g., Weight loss, Muscle gain, General health"}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    This goal will be used to provide personalized nutrition insights
                    {profile?.goal && ` (Default: ${profile.goal})`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Single Unified Upload Section */}
          <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 justify-center">
                <Upload className="w-5 h-5" />
                Upload & Analyze Your Meal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isUsingCamera ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-50/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden max-w-lg mx-auto">
                        <Image
                          src={previewUrl}
                          alt="Meal preview"
                          width={400}
                          height={300}
                          className="w-full h-64 object-cover"
                        />
                      </div>
                      <p className="text-gray-300">Click to change image or drag a new one</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      {isDragActive ? (
                        <p className="text-blue-400">Drop your meal photo here...</p>
                      ) : (
                        <div className="text-gray-300">
                          <p className="mb-2">Drag & drop a meal photo here</p>
                          <p className="text-sm text-gray-400">or click to browse</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    autoPlay
                    muted
                    className="w-full h-64 bg-black rounded-lg mx-auto max-w-lg"
                    ref={(video) => {
                      if (video && stream) {
                        video.srcObject = stream;
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {!isUsingCamera && !previewUrl && (
                  <Button onClick={startCamera} variant="outline" className="flex-1 max-w-xs">
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera
                  </Button>
                )}
                
                {previewUrl && (
                  <>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 max-w-xs bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Meal'
                      )}
                    </Button>
                    <Button onClick={resetUpload} variant="outline" className="max-w-xs">
                      Reset
                    </Button>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 