'use client';
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../app/lib/profile-context';
import Image from 'next/image';

// Simple inline components with dark theme styling
const Button = ({ children, onClick, disabled, className = '', variant = 'default', ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'ghost' 
        ? 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white' 
        : disabled 
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-gray-800 rounded-lg border border-gray-700 shadow-lg ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Input = ({ className = '', ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }: any) => (
  <label className={`text-sm font-medium text-gray-200 ${className}`} {...props}>
    {children}
  </label>
);

// Simple icons
const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function MealUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealSpecificGoal, setMealSpecificGoal] = useState('');
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { profile } = useProfile();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    noClick: true, // We'll handle clicks manually
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
      // Analyze meal
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', selectedFile);
      if (mealSpecificGoal) {
        analyzeFormData.append('goal', mealSpecificGoal);
      } else if (profile?.goal) {
        analyzeFormData.append('goal', profile.goal);
      }

      const analyzeResponse = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: analyzeFormData,
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.status}`);
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
    stopCamera();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-center mb-2 text-white">Upload Your Meal</h2>
              <p className="text-gray-300 text-center">
                Take a photo or upload an image of your meal for AI analysis
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-md p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Camera View */}
            {isUsingCamera && (
              <div className="space-y-4">
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(video) => {
                    if (video && stream) {
                      video.srcObject = stream;
                    }
                  }}
                  className="w-full rounded-lg"
                />
                <div className="flex space-x-2 justify-center">
                  <Button onClick={capturePhoto}>Capture Photo</Button>
                  <Button onClick={stopCamera} variant="ghost">Cancel</Button>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {previewUrl && !isUsingCamera && (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Meal preview"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-600"
                />
                <Button onClick={resetUpload} variant="ghost" className="w-full">
                  Choose Different Image
                </Button>
              </div>
            )}

            {/* Upload Area */}
            {!isUsingCamera && !previewUrl && (
              <div
                {...getRootProps()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  isDragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'
                } border-dashed rounded-md cursor-pointer transition-colors duration-150 ease-in-out`}
              >
                <input {...getInputProps()} />
                <div className="space-y-1 text-center py-6">
                  <ImageIcon />
                  <div className="flex text-sm text-gray-300">
                    <p>Drag & drop an image, or</p>
                  </div>
                  <p className="text-xs text-gray-400">PNG, JPG, JPEG, WEBP up to 10MB</p>
                  <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-center justify-center">
                    <Button
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 w-full sm:w-auto"
                      onClick={(e: any) => { e.stopPropagation(); open(); }}
                    >
                      <UploadIcon />
                      <span className="ml-2">Choose File</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-green-400 hover:text-green-300 w-full sm:w-auto"
                      onClick={(e: any) => { e.stopPropagation(); startCamera(); }}
                    >
                      <CameraIcon />
                      <span className="ml-2">Take Photo</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Input */}
            {(selectedFile || previewUrl) && !isUsingCamera && (
              <div className="space-y-2">
                <Label htmlFor="goal">Specific Goal for this Meal (Optional)</Label>
                <Input
                  id="goal"
                  type="text"
                  placeholder={profile?.goal || "e.g., Post-workout recovery, weight loss, muscle gain"}
                  value={mealSpecificGoal}
                  onChange={(e: any) => setMealSpecificGoal(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Leave blank to use your profile goal: {profile?.goal || 'No goal set'}
                </p>
              </div>
            )}

            {/* Analyze Button */}
            {selectedFile && !isUsingCamera && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <LoaderIcon />
                    <span className="ml-2">Analyzing...</span>
                  </>
                ) : (
                  'Analyze Meal'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 