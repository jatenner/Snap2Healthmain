'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/client/ClientAuthProvider';
import AuthGate from '../components/AuthGate';
import { useProfile } from '../lib/profile-context';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Camera, Save, User, CheckCircle, AlertCircle, Target, Activity, Scale, Ruler, Link2, Link2Off, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // WHOOP integration state
  const searchParams = useSearchParams();
  const [whoopStatus, setWhoopStatus] = useState<{
    connected: boolean;
    lastSyncAt?: string;
    connectedAt?: string;
  }>({ connected: false });
  const [whoopLoading, setWhoopLoading] = useState(true);
  const [whoopSyncing, setWhoopSyncing] = useState(false);
  const [whoopMessage, setWhoopMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    height: '',
    height_unit: 'in',
    weight: '',
    weight_unit: 'lbs',
    primary_goal: '',
    activity_level: ''
  });

  React.useEffect(() => {
    // Only redirect if we're not loading and user is definitely not authenticated
    if (!isLoading && !user) {
      console.log("[ProfilePage] Not authenticated, redirecting to login");
      router.push('/login?redirectTo=/profile');
    } else if (!isLoading) {
      setProfileLoaded(true);
    }
  }, [isLoading, user, router]);

  React.useEffect(() => {
    if (profile) {
      // Handle height - stored height is in inches, display as inches by default
      let displayHeight = profile.height?.toString() || '';
      let heightUnit = 'in'; // Default to inches since that's how we store it
      
      // Use the stored height unit if available, otherwise default to inches
      if (profile.height_unit) {
        heightUnit = profile.height_unit;
      }

      setFormData({
        full_name: profile.full_name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        height: displayHeight,
        height_unit: heightUnit,
        weight: profile.weight?.toString() || '',
        weight_unit: profile.weight_unit || 'lbs',
        primary_goal: profile.goal || '',
        activity_level: profile.activity_level || ''
      });
    }
  }, [profile]);

  // Fetch WHOOP connection status
  useEffect(() => {
    if (!user) return;
    setWhoopLoading(true);
    fetch('/api/whoop/status')
      .then((res) => res.json())
      .then((data) => setWhoopStatus(data))
      .catch(() => setWhoopStatus({ connected: false }))
      .finally(() => setWhoopLoading(false));
  }, [user]);

  // Handle WHOOP OAuth callback query params
  useEffect(() => {
    const whoopParam = searchParams.get('whoop');
    if (whoopParam === 'connected') {
      setWhoopMessage('WHOOP connected successfully!');
      setWhoopStatus((prev) => ({ ...prev, connected: true }));
      // Re-fetch status to get full details
      fetch('/api/whoop/status')
        .then((res) => res.json())
        .then((data) => setWhoopStatus(data))
        .catch(() => {});
    } else if (whoopParam === 'denied') {
      setWhoopMessage('WHOOP connection was denied.');
    } else if (whoopParam === 'error') {
      setWhoopMessage('Failed to connect WHOOP. Please try again.');
    }
  }, [searchParams]);

  const handleWhoopSync = async () => {
    setWhoopSyncing(true);
    setWhoopMessage(null);
    try {
      const res = await fetch('/api/whoop/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWhoopMessage(
          `Synced: ${data.synced.sleep} sleep, ${data.synced.recovery} recovery, ${data.synced.cycles} cycles, ${data.synced.workouts} workouts`
        );
        // Refresh status to update last_sync_at
        const statusRes = await fetch('/api/whoop/status');
        const statusData = await statusRes.json();
        setWhoopStatus(statusData);
      } else {
        setWhoopMessage(data.error || 'Sync failed');
      }
    } catch {
      setWhoopMessage('Sync failed. Please try again.');
    } finally {
      setWhoopSyncing(false);
    }
  };

  const handleWhoopDisconnect = async () => {
    if (!confirm('Disconnect WHOOP? This will remove all synced WHOOP data.')) return;
    try {
      const res = await fetch('/api/whoop/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWhoopStatus({ connected: false });
        setWhoopMessage('WHOOP disconnected.');
      }
    } catch {
      setWhoopMessage('Failed to disconnect. Please try again.');
    }
  };

  // Show loading screen while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate>{null}</AuthGate>;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert height to inches for storage if needed
      let heightInInches = formData.height ? parseFloat(formData.height) : undefined;
      if (heightInInches && formData.height_unit === 'ft') {
        heightInInches = heightInInches * 12; // Convert feet to inches
      } else if (heightInInches && formData.height_unit === "cm") {
        heightInInches = heightInInches * 0.393701; // Convert cm to inches
      }

      const profileData = {
        full_name: formData.full_name,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        height: heightInInches,
        height_unit: 'in', // Always store as inches
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        weight_unit: formData.weight_unit,
        goal: formData.primary_goal,
        activity_level: formData.activity_level
      };

      const result = await updateProfile(profileData);
      if (result.success) {
        console.log('Profile updated successfully');
        // Optionally redirect or show success message
      } else {
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile completeness
  const getProfileCompleteness = () => {
    const fields = [
      formData.full_name,
      formData.age,
      formData.gender,
      formData.height,
      formData.weight,
      formData.primary_goal,
      formData.activity_level
    ];
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completeness = getProfileCompleteness();
  const isProfileComplete = completeness >= 85;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Your Health Profile</h1>
          <p className="text-xl text-gray-300">
            Complete your profile for personalized nutrition analysis
          </p>
        </div>

        {/* Profile Status Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isProfileComplete ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Profile {isProfileComplete ? 'Complete' : 'Incomplete'}
                  </h3>
                  <p className="text-gray-400">
                    {isProfileComplete 
                      ? 'Your profile is ready for personalized analysis'
                      : `${completeness}% complete - Fill in more details for better analysis`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{completeness}%</div>
                <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${isProfileComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${completeness}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Used for Analysis */}
        <Card className="bg-blue-900/30 border-blue-700 mb-6">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              What's Used for Your Meal Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Primary Health Goal:</span>
                  <span className={`font-medium ${formData.primary_goal ? 'text-green-400' : 'text-red-400'}`}>
                    {formData.primary_goal || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Age & Gender:</span>
                  <span className={`font-medium ${formData.age && formData.gender ? 'text-green-400' : 'text-red-400'}`}>
                    {formData.age && formData.gender ? `${formData.age}, ${formData.gender}` : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Activity Level:</span>
                  <span className={`font-medium ${formData.activity_level ? 'text-green-400' : 'text-red-400'}`}>
                    {formData.activity_level || 'Not set'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Height & Weight:</span>
                  <span className={`font-medium ${formData.height && formData.weight ? 'text-green-400' : 'text-red-400'}`}>
                    {formData.height && formData.weight 
                      ? `${formData.height}${formData.height_unit}, ${formData.weight}${formData.weight_unit}` 
                      : 'Not set'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-gray-600"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <Label htmlFor="profile-image" className="cursor-pointer">
                <div className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </div>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </Label>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="age" className="text-gray-300">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Enter your age"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender" className="text-gray-300">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <Label htmlFor="activity_level" className="text-gray-300">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Activity Level
                </Label>
                <select
                  id="activity_level"
                  value={formData.activity_level}
                  onChange={(e) => handleInputChange('activity_level', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select activity level</option>
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="lightly-active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately-active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very-active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extremely-active">Extremely Active (very hard exercise, physical job)</option>
                </select>
              </div>
            </div>

            {/* Primary Health Goal */}
            <div>
              <Label htmlFor="primary_goal" className="text-gray-300">
                <Target className="w-4 h-4 inline mr-1" />
                Primary Health Goal
              </Label>
              <Input
                id="primary_goal"
                value={formData.primary_goal}
                onChange={(e) => handleInputChange('primary_goal', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Enter your primary health goal"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used as your default goal for meal analysis
              </p>
            </div>

            {/* Physical Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Height
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Height"
                    type="number"
                  />
                  <select
                    value={formData.height_unit}
                    onChange={(e) => handleInputChange('height_unit', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-20"
                  >
                    <option value="in">in</option>
                    <option value="ft">ft</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Weight
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Weight"
                    type="number"
                  />
                  <select
                    value={formData.weight_unit}
                    onChange={(e) => handleInputChange('weight_unit', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-20"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* WHOOP Integration */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-6 h-6 mr-2 text-green-400" />
              WHOOP Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {whoopMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                whoopMessage.includes('success') || whoopMessage.includes('Synced')
                  ? 'bg-green-900/40 text-green-300 border border-green-700'
                  : whoopMessage.includes('denied') || whoopMessage.includes('fail') || whoopMessage.includes('Failed')
                  ? 'bg-red-900/40 text-red-300 border border-red-700'
                  : 'bg-blue-900/40 text-blue-300 border border-blue-700'
              }`}>
                {whoopMessage}
              </div>
            )}

            {whoopLoading ? (
              <div className="flex items-center text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Checking WHOOP connection...
              </div>
            ) : whoopStatus.connected ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">WHOOP Connected</span>
                </div>

                {whoopStatus.connectedAt && (
                  <p className="text-sm text-gray-400">
                    Connected since {new Date(whoopStatus.connectedAt).toLocaleDateString()}
                  </p>
                )}

                {whoopStatus.lastSyncAt && (
                  <p className="text-sm text-gray-400">
                    Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={handleWhoopSync}
                    disabled={whoopSyncing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {whoopSyncing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Syncing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync WHOOP Data
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={handleWhoopDisconnect}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/30"
                  >
                    <Link2Off className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Connect your WHOOP account to sync sleep, recovery, HRV, and workout data.
                  This enables future meal-to-biometric correlation insights.
                </p>
                <a href="/api/whoop/connect">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect WHOOP
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 
