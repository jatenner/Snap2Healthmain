'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import Image from 'next/image';
import {
  Camera, Image as ImageIcon, Loader2, MessageSquare, Send, ArrowLeft,
  Zap, Droplets, Coffee, Wine, Pill, Cookie, UtensilsCrossed, Check,
  Repeat, X, Clock
} from 'lucide-react';
import AuthGate from '../components/AuthGate';

type Mode = 'photo' | 'text' | 'quick';

interface Preset {
  id: string;
  name: string;
  intake_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_global: boolean;
  use_count: number;
}

const INTAKE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  hydration: { label: 'Water', icon: Droplets, color: 'text-blue-500' },
  drink: { label: 'Drinks', icon: Coffee, color: 'text-amber-600' },
  alcohol: { label: 'Alcohol', icon: Wine, color: 'text-purple-500' },
  supplement: { label: 'Supplements', icon: Pill, color: 'text-green-500' },
  snack: { label: 'Snacks', icon: Cookie, color: 'text-orange-500' },
};

export default function UploadPage() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as Mode) || 'photo';

  const [mode, setMode] = useState<Mode>(initialMode === 'text' ? 'text' : initialMode === 'quick' ? 'quick' : 'photo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [textDescription, setTextDescription] = useState('');

  // Quick-add state
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);
  const [quickAddLoading, setQuickAddLoading] = useState<string | null>(null);

  // Recurring habits state
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLoading, setHabitLoading] = useState<string | null>(null);

  // Custom habit creation state
  const [habitDescription, setHabitDescription] = useState('');
  const [habitTime, setHabitTime] = useState('08:00');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');
  const [isCreatingHabit, setIsCreatingHabit] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  // Load presets and habits when Quick Add mode is selected
  useEffect(() => {
    if (mode === 'quick' && presets.length === 0) {
      setPresetsLoading(true);
      Promise.all([
        fetch('/api/quick-add').then(r => r.json()),
        fetch('/api/habits').then(r => r.json()),
      ])
        .then(([presetData, habitData]) => {
          setPresets(presetData.presets || []);
          setHabits(habitData.habits || []);
        })
        .catch(() => setError('Failed to load presets'))
        .finally(() => setPresetsLoading(false));
    }
  }, [mode, presets.length]);

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
      const userTimezone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userTimezone ? { 'x-timezone': userTimezone } : {}),
        },
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

  // Quick-add from preset
  const handleQuickAdd = async (preset: Preset) => {
    setQuickAddLoading(preset.id);
    setError('');
    setQuickAddSuccess(null);

    try {
      const res = await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: preset.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to log' }));
        throw new Error(errData.error || 'Failed to log');
      }

      setQuickAddSuccess(preset.name);
      // Clear success after 2 seconds
      setTimeout(() => setQuickAddSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to log');
    } finally {
      setQuickAddLoading(null);
    }
  };

  // Create a custom recurring habit from freeform text
  const handleCreateCustomHabit = async () => {
    if (!habitDescription.trim()) return;
    setIsCreatingHabit(true);
    setError('');

    try {
      // Step 1: Analyze the description with GPT to get real nutrition data
      const habitTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
      const analyzeRes = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(habitTz ? { 'x-timezone': habitTz } : {}),
        },
        body: JSON.stringify({ description: habitDescription.trim() }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData.error || 'Failed to analyze');
      }

      const analysis = await analyzeRes.json();

      // Step 2: Create the recurring habit with the analyzed nutrition data
      const habitRes = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: analysis.name || habitDescription.trim(),
          intakeType: analysis.consumptionType || 'meal',
          timeOfDay: habitTime,
          frequency: habitFrequency,
          nutrients: {
            calories: analysis.calories || 0,
            protein: analysis.protein || 0,
            carbs: analysis.carbs || 0,
            fat: analysis.fat || 0,
            macronutrients: analysis.macronutrients || [],
            micronutrients: analysis.micronutrients || [],
          },
        }),
      });

      if (!habitRes.ok) throw new Error('Failed to save habit');

      const habitData = await habitRes.json();
      setHabits(prev => [...prev, habitData.habit]);
      setQuickAddSuccess(`"${habitDescription.trim()}" added as ${habitFrequency} habit`);
      setHabitDescription('');
      setTimeout(() => setQuickAddSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create habit');
    } finally {
      setIsCreatingHabit(false);
    }
  };

  // Create a recurring habit from a preset
  const handleMakeHabit = async (preset: Preset, timeOfDay: string = '08:00') => {
    setHabitLoading(preset.id);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: preset.id, timeOfDay }),
      });
      if (res.ok) {
        const data = await res.json();
        setHabits(prev => [...prev, data.habit]);
        setQuickAddSuccess(`${preset.name} set as daily habit`);
        setTimeout(() => setQuickAddSuccess(null), 2500);
      }
    } catch (e) {
      setError('Failed to create habit');
    } finally {
      setHabitLoading(null);
    }
  };

  // Remove a recurring habit
  const handleRemoveHabit = async (habitId: string) => {
    setHabitLoading(habitId);
    try {
      await fetch(`/api/habits?id=${habitId}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== habitId));
    } catch (e) {
      setError('Failed to remove habit');
    } finally {
      setHabitLoading(null);
    }
  };

  // Check if a preset is already a habit
  const isHabit = (presetId: string) => habits.some(h => h.preset_id === presetId && h.active);
  const getHabitForPreset = (presetId: string) => habits.find(h => h.preset_id === presetId && h.active);

  // Group presets by intake_type
  const groupedPresets: Record<string, Preset[]> = {};
  for (const preset of presets) {
    const type = preset.intake_type;
    if (!groupedPresets[type]) groupedPresets[type] = [];
    groupedPresets[type].push(preset);
  }

  const getPresetIcon = (intakeType: string) => {
    const config = INTAKE_TYPE_CONFIG[intakeType];
    if (config) {
      const Icon = config.icon;
      return <Icon className={`w-4 h-4 ${config.color}`} />;
    }
    return <UtensilsCrossed className="w-4 h-4 text-gray-500" />;
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Log Consumption</h1>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-white rounded-xl p-1">
            <button
              onClick={() => { setMode('photo'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'photo' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" /> Photo
            </button>
            <button
              onClick={() => { setMode('text'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Describe
            </button>
            <button
              onClick={() => { setMode('quick'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'quick' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" /> Quick Add
            </button>
          </div>

          {/* Quick-add success banner */}
          {quickAddSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">Logged: {quickAddSuccess}</p>
            </div>
          )}

          {/* ====== PHOTO MODE ====== */}
          {mode === 'photo' && (
            <div className="space-y-4">
              {!isUsingCamera ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-gray-300 hover:border-slate-500'
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
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm mb-1">Drop a photo here or tap to browse</p>
                      <p className="text-xs text-gray-400">Meals, beverages, supplements — anything you consumed</p>
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
                    <button onClick={stopCamera} className="bg-gray-100 hover:bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!isUsingCamera && !previewUrl && (
                  <button onClick={startCamera} className="flex-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-900 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
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
                    <button onClick={() => { setSelectedFile(null); setPreviewUrl(''); }} className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-3 rounded-xl text-sm">
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
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder={"Describe what you had...\n\nExamples:\n\u2022 Chicken breast with rice and broccoli at 12:30pm\n\u2022 Large iced coffee with oat milk\n\u2022 3 beers and some nachos\n\u2022 Vitamin D 5000 IU supplement\n\u2022 2 glasses of water"}
                  className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none min-h-[160px]"
                  rows={6}
                />
              </div>

              <button
                onClick={handleTextAnalyze}
                disabled={isAnalyzing || !textDescription.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Analyze</>
                )}
              </button>
            </div>
          )}

          {/* ====== QUICK ADD MODE ====== */}
          {mode === 'quick' && (
            <div className="space-y-5">
              {presetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Add a daily pattern */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-blue-500" />
                      Add a Daily Pattern
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Describe something you have regularly. We'll analyze it once and auto-log it for you.
                    </p>
                    <textarea
                      value={habitDescription}
                      onChange={(e) => setHabitDescription(e.target.value)}
                      placeholder={"Examples:\n\u2022 Tablespoon of olive oil\n\u2022 Black coffee with cream\n\u2022 Two eggs and toast\n\u2022 Fish oil and vitamin D supplement"}
                      className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      rows={3}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="time"
                          value={habitTime}
                          onChange={(e) => setHabitTime(e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none"
                        />
                      </div>
                      <select
                        value={habitFrequency}
                        onChange={(e) => setHabitFrequency(e.target.value as any)}
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none"
                      >
                        <option value="daily">Every day</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                      </select>
                      <button
                        onClick={handleCreateCustomHabit}
                        disabled={isCreatingHabit || !habitDescription.trim()}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {isCreatingHabit ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Repeat className="w-3 h-3" /> Add Habit</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Active daily habits */}
                  {habits.filter(h => h.active).length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-blue-500" /> Daily Habits
                        <span className="text-[10px] font-normal text-gray-400 ml-1">(auto-logged)</span>
                      </h3>
                      <div className="space-y-1.5">
                        {habits.filter(h => h.active).map(habit => (
                          <div key={habit.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {getPresetIcon(habit.intake_type)}
                              <div>
                                <span className="text-sm font-medium text-gray-900">{habit.name}</span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Clock className="w-2.5 h-2.5" />
                                  {habit.time_of_day?.slice(0, 5)} · {habit.frequency}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveHabit(habit.id)}
                              disabled={habitLoading === habit.id}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              {habitLoading === habit.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preset grid with repeat buttons */}
                  {['hydration', 'drink', 'alcohol', 'supplement', 'snack'].map(type => {
                    const items = groupedPresets[type];
                    if (!items || items.length === 0) return null;
                    const config = INTAKE_TYPE_CONFIG[type];
                    if (!config) return null;

                    return (
                      <div key={type}>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          {getPresetIcon(type)} {config.label}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {items.map(preset => (
                            <div key={preset.id} className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                              <button
                                onClick={() => handleQuickAdd(preset)}
                                disabled={quickAddLoading === preset.id}
                                className="w-full text-left disabled:opacity-60"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {quickAddLoading === preset.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                  ) : (
                                    getPresetIcon(preset.intake_type)
                                  )}
                                  <span className="text-sm font-medium text-gray-900 truncate">{preset.name}</span>
                                </div>
                                {preset.calories > 0 && (
                                  <p className="text-xs text-gray-400 ml-6">{preset.calories} cal</p>
                                )}
                              </button>
                              {/* Repeat button */}
                              <div className="mt-1.5 ml-6">
                                {isHabit(preset.id) ? (
                                  <span className="text-[10px] text-blue-500 flex items-center gap-1">
                                    <Repeat className="w-2.5 h-2.5" /> Repeating daily
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMakeHabit(preset); }}
                                    disabled={habitLoading === preset.id}
                                    className="text-[10px] text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                                  >
                                    {habitLoading === preset.id
                                      ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                      : <Repeat className="w-2.5 h-2.5" />}
                                    Make daily habit
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <p className="text-xs text-gray-400 text-center pt-2">
                Tap to log once. Use <Repeat className="w-3 h-3 inline" /> to set as daily habit.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Info */}
          {mode !== 'quick' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Upload photos of meals, beverages, or supplements. Describe anything you consumed.
                <br />Everything shown is assumed to be fully consumed.
              </p>
            </div>
          )}

        </div>
      </div>
    </AuthGate>
  );
}
