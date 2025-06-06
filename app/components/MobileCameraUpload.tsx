'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  RotateCcw, 
  Zap, 
  FlashOff, 
  Grid3X3, 
  X, 
  Check,
  ArrowLeft,
  Sparkles,
  Target,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface MobileCameraUploadProps {
  onCapture?: (file: File) => void;
  onClose?: () => void;
  autoAnalyze?: boolean;
}

export default function MobileCameraUpload({ 
  onCapture, 
  onClose,
  autoAnalyze = true 
}: MobileCameraUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [showGrid, setShowGrid] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  
  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen, facingMode]);
  
  // Handle device orientation and viewport
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to allow browser to adjust
      setTimeout(() => {
        if (videoRef.current && stream) {
          adjustVideoSize();
        }
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [stream]);
  
  const initializeCamera = async () => {
    try {
      setError(null);
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Check for flash capability
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        setHasFlash(!!capabilities?.torch);
        
        // Wait for video to load and adjust size
        videoRef.current.onloadedmetadata = () => {
          adjustVideoSize();
        };
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(err.message || 'Could not access camera');
      toast.error('Unable to access camera. Please check permissions.');
    }
  };
  
  const adjustVideoSize = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const aspectRatio = video.videoWidth / video.videoHeight;
    const containerAspectRatio = window.innerWidth / window.innerHeight;
    
    if (aspectRatio > containerAspectRatio) {
      video.style.width = '100%';
      video.style.height = 'auto';
    } else {
      video.style.width = 'auto';
      video.style.height = '100%';
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Apply flash effect if enabled
      if (flashMode === 'on' && hasFlash) {
        await toggleFlash(true);
      }
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          
          // Create file from blob
          const file = new File([blob], `meal-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          if (onCapture) {
            onCapture(file);
          }
          
          if (autoAnalyze) {
            analyzeImage(file);
          }
        }
      }, 'image/jpeg', 0.9);
      
      // Turn off flash
      if (flashMode === 'on' && hasFlash) {
        setTimeout(() => toggleFlash(false), 100);
      }
      
      // Add capture feedback
      const flashDiv = document.createElement('div');
      flashDiv.className = 'fixed inset-0 bg-white opacity-70 z-50 pointer-events-none';
      document.body.appendChild(flashDiv);
      
      setTimeout(() => {
        document.body.removeChild(flashDiv);
      }, 100);
      
    } catch (err) {
      console.error('Error capturing photo:', err);
      toast.error('Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };
  
  const toggleFlash = async (enable: boolean) => {
    if (!stream || !hasFlash) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: enable }]
      });
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };
  
  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };
  
  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', 'General Health');
      formData.append('mealName', `Mobile Capture ${new Date().toLocaleTimeString()}`);
      
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const result = await response.json();
      
      if (result.success && result.mealId) {
        toast.success('Photo captured and analyzed!');
        router.push(`/analysis/${result.mealId}`);
        handleClose();
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      toast.error('Failed to analyze meal. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };
  
  const retakePhoto = () => {
    setCapturedImage(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Camera className="w-5 h-5 mr-2" />
        Open Camera
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-white font-medium">
          {capturedImage ? 'Review Photo' : 'Take Photo'}
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </div>
      
      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {!capturedImage ? (
          <>
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 object-cover w-full h-full"
            />
            
            {/* Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
            )}
            
            {/* Focus Target */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <Target className="w-16 h-16 text-white/30" />
            </div>
            
            {/* Top Controls */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              {hasFlash && (
                <button
                  onClick={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
                  className={`p-3 rounded-full ${
                    flashMode === 'on' ? 'bg-yellow-500' : 'bg-black/30'
                  } text-white hover:bg-black/50 transition-colors`}
                >
                  {flashMode === 'on' ? <Zap className="w-5 h-5" /> : <FlashOff className="w-5 h-5" />}
                </button>
              )}
              
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-3 rounded-full ${
                  showGrid ? 'bg-white/20' : 'bg-black/30'
                } text-white hover:bg-black/50 transition-colors`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-8">
              {/* Gallery Button (placeholder) */}
              <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-white/50" />
              </div>
              
              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={isCapturing || !stream}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95">
                  {isCapturing ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white" />
                  )}
                </div>
              </button>
              
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Captured Image Preview */}
            <img
              src={capturedImage}
              alt="Captured meal"
              className="w-full h-full object-cover"
            />
            
            {/* Review Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-6">
              <button
                onClick={retakePhoto}
                className="flex items-center space-x-2 px-6 py-3 bg-black/50 backdrop-blur-sm text-white rounded-xl hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Retake</span>
              </button>
              
              {autoAnalyze && (
                <button
                  onClick={() => {
                    const file = new File([], 'captured-meal.jpg', { type: 'image/jpeg' });
                    analyzeImage(file);
                  }}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze</span>
                    </>
                  )}
                </button>
              )}
              
              {!autoAnalyze && (
                <button
                  onClick={() => {
                    toast.success('Photo saved!');
                    handleClose();
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Check className="w-5 h-5" />
                  <span>Use Photo</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg">
          <p className="text-center">{error}</p>
        </div>
      )}
      
      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 