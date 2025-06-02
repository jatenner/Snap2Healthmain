'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, AlertCircle, CheckCircle, User } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple loading spinner component
function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };
  
  return (
    <div className={`${sizeClasses[size]} border-t-blue-500 border-blue-200 rounded-full animate-spin`}></div>
  );
}

// Simplified Auth context
function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        } else {
          // Try to get from localStorage as fallback
          try {
            const profileData = localStorage.getItem('profile_backup');
            if (profileData) {
              const parsed = JSON.parse(profileData);
              if (parsed.id) {
                setUser({ id: parsed.id });
              }
            }
          } catch (e) {
            console.warn('Failed to load profile from backup:', e);
          }
        }
      } catch (e) {
        console.error('Unexpected error in auth:', e);
      } finally {
        setIsLoading(false);
      }
    }
    
    getUser();
  }, [supabase]);
  
  return { user, isLoading };
}

export default function ProfileClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  
  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    gender: '',
    height: '', // in inches
    weight: '', // in pounds
    goal: '',
    activity_level: 'Moderate',
    customGoal: ''
  });
  
  // Supabase client
  const supabase = createClientComponentClient();
  
  // Fetch existing profile data
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      
      // Try to get user ID either from auth or localStorage
      const userId = user?.id || (() => {
        try {
          const profileData = localStorage.getItem('profile_backup');
          if (profileData) {
            const parsed = JSON.parse(profileData);
            return parsed.id;
          }
        } catch (e) {
          console.warn('Failed to get ID from backup:', e);
        }
        return null;
      })();
      
      if (!userId) {
        console.log('No user ID available, using default profile');
        setLoading(false);
        
        // Set a default profile rather than showing nothing
        setProfile({
          full_name: 'Guest User',
          age: '25',
          gender: 'Not specified',
          height: '70',
          weight: '160',
          goal: 'General Health',
          activity_level: 'Moderate',
          customGoal: 'General Health'
        });
        return;
      }
      
      console.log('Attempting to load profile for user:', userId);
      
      try {
        // First try the standard profile fetch
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          
          // If no profile found, don't show error to user
          if (error.code === 'PGRST116') {
            console.log('No profile found, trying localStorage backup');
            
            // Try to load from localStorage as fallback
            try {
              const localProfile = localStorage.getItem('profile_backup');
              if (localProfile) {
                const parsedProfile = JSON.parse(localProfile);
                setProfile({
                  full_name: parsedProfile.full_name || '',
                  age: parsedProfile.age?.toString() || '',
                  gender: parsedProfile.gender || '',
                  height: parsedProfile.height?.toString() || '',
                  weight: parsedProfile.weight?.toString() || '',
                  goal: parsedProfile.goal || 'General Health',
                  activity_level: parsedProfile.activity_level || 'Moderate',
                  customGoal: parsedProfile.goal || 'General Health'
                });
                console.log('Loaded profile from localStorage backup');
              }
            } catch (e) {
              console.warn('Failed to load profile from localStorage:', e);
            }
          } else {
            setError('Failed to load profile data. Please try again later.');
          }
        }
        
        if (data) {
          console.log('Profile loaded successfully:', data);
          
          // Convert units for display
          setProfile({
            full_name: data.full_name || '',
            age: data.age?.toString() || '',
            gender: data.gender || '',
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
            goal: data.goal || 'General Health',
            activity_level: data.activity_level || 'Moderate',
            customGoal: data.goal || 'General Health'
          });
          
          // Store backup in localStorage
          try {
            localStorage.setItem('profile_backup', JSON.stringify(data));
          } catch (e) {
            console.warn('Failed to store profile backup:', e);
          }
        }
        
        // Fetch recent meal history for this user
        try {
          const { data: mealsData, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (mealsError) {
            console.error('Error fetching meal history:', mealsError);
          } else if (mealsData && mealsData.length > 0) {
            console.log('Loaded meal history:', mealsData);
            setMealHistory(mealsData);
          } else {
            // Try to get from localStorage
            try {
              const keys = Object.keys(localStorage);
              const mealKeys = keys.filter(k => k.startsWith('meal_analysis_'));
              
              const localMeals = mealKeys.map(key => {
                try {
                  return JSON.parse(localStorage.getItem(key) || '{}');
                } catch {
                  return null;
                }
              }).filter(Boolean);
              
              if (localMeals.length > 0) {
                console.log('Loaded meal history from localStorage:', localMeals);
                setMealHistory(localMeals);
              }
            } catch (e) {
              console.warn('Error loading meals from localStorage:', e);
            }
          }
        } catch (e) {
          console.error('Unexpected error fetching meals:', e);
        }
      } catch (e) {
        console.error('Unexpected error loading profile:', e);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user, supabase]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If we're updating the custom goal, also update the main goal field
    if (name === 'customGoal') {
      setProfile(prev => ({
        ...prev,
        goal: value
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!profile.full_name) {
      setError('Please provide your name');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare data for saving - convert string values to appropriate types
      const userId = user?.id || '8751af51-f8f5-4a18-a3cf-534883906356'; // Use default ID if not available
      
      const profileData = {
        id: userId,
        full_name: profile.full_name,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        goal: profile.goal || 'General Health',
        activity_level: profile.activity_level || 'Moderate',
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving profile data:', profileData);
      
      // Try to update profile
      let { error } = await supabase
        .from('profiles')
        .upsert(profileData);
      
      if (error) {
        console.error('Error saving profile:', error);
        
        // Save to localStorage even if Supabase fails
        try {
          localStorage.setItem('profile_backup', JSON.stringify(profileData));
          localStorage.setItem('snap2health_profile', JSON.stringify(profileData));
          localStorage.setItem('user_profile', JSON.stringify(profileData));
          setSuccess('Profile saved locally (database update failed)');
        } catch (e) {
          console.warn('Failed to store profile backup:', e);
          setError('Failed to save profile. Please try again later.');
        }
      } else {
        setSuccess('Profile updated successfully!');
        
        // Store backup in localStorage
        try {
          localStorage.setItem('profile_backup', JSON.stringify(profileData));
          localStorage.setItem('snap2health_profile', JSON.stringify(profileData));
          localStorage.setItem('user_profile', JSON.stringify(profileData));
          
          // Dispatch event to notify components of profile update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('profile-updated'));
          }
        } catch (e) {
          console.warn('Failed to store profile backup:', e);
        }
      }
    } catch (err) {
      console.error('Unexpected error saving profile:', err);
      setError('An unexpected error occurred while saving your profile.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg backdrop-blur-lg border border-gray-700/50 p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-blue-500/20 rounded-full p-3 mr-3">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 rounded p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/30 border border-green-800/50 rounded p-3 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2" />
              <p className="text-green-200">{success}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  min="0"
                  max="120"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                  placeholder="Your age"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Height (inches)</label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                  placeholder="Your height in inches"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Weight (pounds)</label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                  placeholder="Your weight in pounds"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Activity Level</label>
                <select
                  name="activity_level"
                  value={profile.activity_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                >
                  <option value="Sedentary">Sedentary</option>
                  <option value="Lightly Active">Lightly Active</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Very Active">Very Active</option>
                  <option value="Extremely Active">Extremely Active</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">Goal</label>
            <select
              name="customGoal"
              value={profile.customGoal}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
            >
              <option value="General Health">General Health</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Weight Gain">Weight Gain</option>
              <option value="Muscle Building">Muscle Building</option>
              <option value="Athletic Performance">Athletic Performance</option>
              <option value="Heart Health">Heart Health</option>
              <option value="Balanced Nutrition">Balanced Nutrition</option>
            </select>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Meal History Section */}
      <div className="bg-gray-800/50 rounded-lg backdrop-blur-lg border border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Recent Meal History</h2>
        
        {mealHistory.length > 0 ? (
          <div className="space-y-4">
            {mealHistory.map((meal, index) => (
              <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-blue-500/30 transition duration-150">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{meal.caption || meal.mealName || "Analyzed Meal"}</h3>
                  <span className="text-sm text-gray-400">
                    {new Date(meal.created_at || meal.updated_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  {(meal.analysis?.calories || meal.calories || 0) + ' calories'}
                </p>
                <div className="mt-2">
                  <Link
                    href={`/meal-analysis?id=${meal.id || meal.mealId}`}
                    className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
                  >
                    View Details
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No meal history found</p>
            <Link 
              href="/upload" 
              className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Upload Your First Meal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 