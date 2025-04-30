'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProfileDashboard from '@/components/ProfileDashboard';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';

interface ProfileFormData {
  username: string;
  defaultGoal: string;
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
}

// Match the User interface from AuthContext but extend it with Supabase properties
interface User {
  id: string;
  name?: string;
  email?: string;
  // These properties are available from Supabase but not in the AuthContext
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: {
    username?: string;
    defaultGoal?: string;
    height?: string;
    weight?: string;
    age?: string;
    gender?: string;
  };
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [supabase] = useState(() => createClientComponentClient<Database>());
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    defaultGoal: 'General Wellness',
  });

  // Load user data when the component mounts
  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setFormData({
        username: user.user_metadata?.username || '',
        defaultGoal: user.user_metadata?.defaultGoal || 'General Wellness',
        height: user.user_metadata?.height || '',
        weight: user.user_metadata?.weight || '',
        age: user.user_metadata?.age || '',
        gender: user.user_metadata?.gender || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: formData.username,
          defaultGoal: formData.defaultGoal,
          height: formData.height,
          weight: formData.weight,
          age: formData.age,
          gender: formData.gender,
        },
      });

      if (error) throw error;

      setMessage({
        text: 'Profile updated successfully!',
        type: 'success',
      });
      
      // After successful update, refresh the page to ensure we have the latest data
      setTimeout(() => {
        router.refresh();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({
        text: err.message || 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size="md" text="Loading your profile..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
          <p>Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      {/* Add ProfileDashboard before the form for users that have already saved profile data */}
      {formData.height || formData.weight || formData.age || formData.gender ? (
        <div className="mb-12">
          <ProfileDashboard />
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload Section */}
          <div className="pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Picture</h2>
            <ProfileImageUpload 
              user={user} 
              onImageUploaded={(url) => {
                // Refresh user data after upload
                setTimeout(() => router.refresh(), 1000);
              }} 
            />
          </div>

          {/* Basic Information Section */}
          <div className="pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                placeholder="Your username"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email || ''}
                readOnly
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>
          
          {/* Demographic Information Section */}
          <div className="pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Health Profile</h2>
            <p className="text-sm text-gray-600 mb-6">
              This information helps us provide more personalized nutritional recommendations based on your specific needs.
              Your data is private and used only to enhance your nutrition guidance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height
                </label>
                <div className="relative">
                  <input
                    id="height"
                    name="height"
                    type="text"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    placeholder="Your height"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    inches
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Height in inches (e.g., 5'10" = 70 inches)</p>
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p className="font-medium">Quick conversion:</p>
                  <ul className="mt-1 space-y-1">
                    <li>5'0" = 60 inches</li>
                    <li>5'6" = 66 inches</li>
                    <li>6'0" = 72 inches</li>
                  </ul>
                  <p className="mt-1">Formula: (feet × 12) + inches</p>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <div className="relative">
                  <input
                    id="weight"
                    name="weight"
                    type="text"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    placeholder="Your weight"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    lbs
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Weight in pounds</p>
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="text"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder="Your age"
                />
                <p className="mt-1 text-xs text-gray-500">Different age groups have different nutritional needs</p>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Used to tailor nutrient recommendations</p>
              </div>
            </div>
          </div>
          
          {/* Health Goals Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Goals</h2>
            
            <div className="mb-4">
              <label htmlFor="defaultGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Default Nutritional Goal
              </label>
              <select
                id="defaultGoal"
                name="defaultGoal"
                value={formData.defaultGoal}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700"
              >
                <option value="General Wellness">General Wellness</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="Heart Health">Heart Health</option>
                <option value="Blood Sugar Management">Blood Sugar Management</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This helps us provide recommendations that align with your health objectives
              </p>
            </div>
          </div>

          {/* Submit Button and Message */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
            
            {message && (
              <div
                className={`mt-4 p-3 rounded ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Stats Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Account Created</p>
            <p className="text-lg font-medium">
              {(user as any).created_at
                ? new Date((user as any).created_at).toLocaleDateString()
                : 'Not available'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Last Sign In</p>
            <p className="text-lg font-medium">
              {(user as any).last_sign_in_at
                ? new Date((user as any).last_sign_in_at).toLocaleDateString()
                : 'Not available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 