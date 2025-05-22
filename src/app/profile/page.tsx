'use client';

import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
=======
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

interface ProfileFormData {
  username: string;
  defaultGoal: string;
}

export default function ProfilePage() {
<<<<<<< HEAD
  const { user, isLoading: loading } = useAuth();
=======
  const { user, loading: authLoading } = useAuth();
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    defaultGoal: 'General Wellness',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setFormData({
<<<<<<< HEAD
        username: user?.user_metadata?.username || user?.email || '',
=======
        username: user.user_metadata?.username || '',
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
        defaultGoal: user.user_metadata?.defaultGoal || 'General Wellness',
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
        },
      });

      if (error) throw error;

      setMessage({
        text: 'Profile updated successfully!',
        type: 'success',
      });
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

<<<<<<< HEAD
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size={48} />
=======
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner size="large" />
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
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
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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

          {/* Default Goal */}
          <div>
            <label htmlFor="defaultGoal" className="block text-sm font-medium text-gray-700 mb-1">
              Default Health Goal
            </label>
            <select
              id="defaultGoal"
              name="defaultGoal"
              value={formData.defaultGoal}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Heart Health">Heart Health</option>
              <option value="Diabetes Management">Diabetes Management</option>
              <option value="General Wellness">General Wellness</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This goal will be selected by default when analyzing new meals
            </p>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
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
<<<<<<< HEAD
              {new Date().toLocaleDateString()}
=======
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'Not available'}
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Last Sign In</p>
            <p className="text-lg font-medium">
<<<<<<< HEAD
              {new Date().toLocaleDateString()}
=======
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString()
                : 'Not available'}
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 