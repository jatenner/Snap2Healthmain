'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import Image from 'next/image';
import { Camera, Image as ImageIcon, Loader2, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import AuthGate from '../components/AuthGate';

export default function UploadPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'text' ? 'text' : 'photo';

  const [mode, setMode] = useState<'photo' | 'text'>(initialMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [textDescription, setTextDescription] = useState('');

  const router = useRouter();
  const { user } = useAuth();

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
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024,
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
    } catch {
      setError('Camera access denied or not available');
    }
  };

  const capturePhoto = () => {
    const video = document.querySelector('video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
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

  // Photo-based analysis
  const handlePhotoAnalyze = async () => {
    if (!selectedFile) { setError('Please select an image first'); return; }
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/analyze-meal', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData.error || `Analysis failed: ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.mealId) {
        router.push(`/meal/${result.mealId}`);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text-based analysis
  const handleTextAnalyze = async () => {
    if (!textDescription.trim()) { setError('Please describe what you consumed'); return; }
    setIsAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: textDescription.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData.error || `Analysis failed: ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.mealId) {
        router.push(`/meal/${result.mealId}`);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Log Consumption</h1>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => { setMode('photo'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'photo' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" /> Photo
            </button>
            <button
              onClick={() => { setMode('text'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Describe
            </button>
          </div>

          {/* ====== PHOTO MODE ====== */}
          {mode === 'photo' && (
            <div className="space-y-4">
              {!isUsingCamera ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {previewUrl ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden max-w-sm mx-auto">
                        <Image src={previewUrl} alt="Preview" width={400} height={300} className="w-full h-56 object-cover" />
                      </div>
                      <p className="text-xs text-gray-400">Tap to change image</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-300 text-sm mb-1">Drop a photo here or tap to browse</p>
                      <p className="text-xs text-gray-500">Meals, beverages, supplements — anything you consumed</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <video
                    autoPlay muted
                    className="w-full h-56 bg-black rounded-2xl"
                    ref={(video) => { if (video && stream) video.srcObject = stream; }}
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Capture
                    </button>
                    <button onClick={stopCamera} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!isUsingCamera && !previewUrl && (
                  <button onClick={startCamera} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                )}
                {previewUrl && (
                  <>
                    <button
                      onClick={handlePhotoAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Analyze'}
                    </button>
                    <button onClick={() => { setSelectedFile(null); setPreviewUrl(''); }} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl text-sm">
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ====== TEXT MODE ====== */}
          {mode === 'text' && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="Describe what you had...&#10;&#10;Examples:&#10;• Chicken breast with rice and broccoli at 12:30pm&#10;• Large iced coffee with oat milk&#10;• Vitamin D 5000 IU supplement&#10;• Turkey sandwich, chips, and a Diet Coke around 1pm"
                  className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none min-h-[160px]"
                  rows={6}
                />
              </div>

              <button
                onClick={handleTextAnalyze}
                disabled={isAnalyzing || !textDescription.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Analyze</>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Upload photos of meals, beverages, or supplements. Describe anything you consumed.
              <br />Everything shown is assumed to be fully consumed.
            </p>
          </div>

        </div>
      </div>
    </AuthGate>
  );
}
