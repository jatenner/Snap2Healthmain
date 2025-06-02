'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth';
import { useProfile } from '@/app/lib/profile-context';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import Logo from '@/app/components/Logo';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Target, 
  TrendingUp, 
  X, 
  Check,
  Loader2,
  ImageIcon,
  Zap,
  Brain,
  Heart,
  ArrowRight,
  ChefHat,
  Clock,
  Award
} from 'lucide-react';

interface AnalysisResult {
  mealId: string;
  mealName?: string;
  calories?: number;
  macronutrients?: Array<{
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number;
  }>;
  micronutrients?: Array<{
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number;
  }>;
  analysis?: any;
  insights?: string;
  imageUrl?: string;
}

export default function UploadPage() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealSpecificGoal, setMealSpecificGoal] = useState('');
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, router]);

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
    noClick: true,
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
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

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

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.status}`);
      }

      const result = await analyzeResponse.json();
      
      if (result.success && result.mealId) {
        setTimeout(() => {
          router.push(`/analysis/${result.mealId}`);
        }, 1000);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze meal');
      setUploadProgress(0);
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1000);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMealSpecificGoal('');
    setError('');
    setUploadProgress(0);
    stopCamera();
  };

  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
            <ChefHat className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-300 text-lg">Preparing your kitchen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Logo size="lg" showText={false} />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
            Snap2Health
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Transform any meal into actionable nutrition insights with our AI-powered analysis
          </p>
        </div>

        {/* Main Upload Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
            
            {/* Camera View */}
            {isUsingCamera && (
              <div className="p-8">
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(video) => {
                      if (video && stream) {
                        video.srcObject = stream;
                      }
                    }}
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-blue-500/30 rounded-2xl pointer-events-none"></div>
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={capturePhoto}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Camera className="w-5 h-5 inline mr-2" />
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-8 py-4 bg-slate-700 text-slate-300 rounded-xl font-semibold hover:bg-slate-600 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {previewUrl && !isUsingCamera && (
              <div className="p-8">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 mb-6">
                  <Image
                    src={previewUrl}
                    alt="Meal preview"
                    width={800}
                    height={400}
                    className="w-full h-96 object-cover"
                  />
                  <button
                    onClick={resetUpload}
                    className="absolute top-4 right-4 w-10 h-10 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Goal Input */}
                <div className="mb-6">
                  <label className="block text-slate-300 font-medium mb-3">
                    Specific Goal for this Meal (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={profile?.goal || "e.g., Post-workout recovery, weight loss, muscle gain"}
                    value={mealSpecificGoal}
                    onChange={(e) => setMealSpecificGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    Current profile goal: {profile?.goal || 'No goal set'}
                  </p>
                </div>

                {/* Analysis Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing your meal...</span>
                      <span className="text-sm opacity-75">({Math.round(uploadProgress)}%)</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>Analyze Meal</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {/* Progress Bar */}
                {isAnalyzing && (
                  <div className="mt-4">
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Area */}
            {!isUsingCamera && !previewUrl && (
              <div className="p-8">
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-500/10 scale-105' 
                      : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-slate-400" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {isDragActive ? 'Drop your meal photo here' : 'Upload your meal photo'}
                      </h3>
                      <p className="text-slate-400 mb-6">
                        Drag & drop an image, or choose from the options below
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); open(); }}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Upload className="w-5 h-5 inline mr-2" />
                        Choose File
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); startCamera(); }}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Camera className="w-5 h-5 inline mr-2" />
                        Take Photo
                      </button>
                    </div>

                    <p className="text-sm text-slate-500">
                      Supports PNG, JPG, JPEG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mx-8 mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                <p className="text-red-300 text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Personalized Analysis</h3>
              <p className="text-slate-400 text-sm">Get insights tailored to your health goals and dietary preferences</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
              <p className="text-slate-400 text-sm">Advanced computer vision and nutrition database analysis</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Track Progress</h3>
              <p className="text-slate-400 text-sm">Monitor your nutrition journey and see improvements over time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 