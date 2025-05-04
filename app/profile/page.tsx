'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/context/auth';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/src/lib/supabase-singleton';
import { Spinner } from '@/src/components/ui/spinner';
import { getCookie } from 'cookies-next';

interface ProfileFormData {
  username: string;
  defaultGoal: string;
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
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
    activityLevel?: string;
  };
}

// Component that will be fixed or created in a separate edit if needed
const UserHealthSummary = () => {
  const { user } = useAuth();
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-2">Your Health Data</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {user?.user_metadata?.height && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500">Height</div>
            <div className="font-bold">{user.user_metadata.height}″</div>
          </div>
        )}
        {user?.user_metadata?.weight && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500">Weight</div>
            <div className="font-bold">{user.user_metadata.weight} lbs</div>
          </div>
        )}
        {user?.user_metadata?.age && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500">Age</div>
            <div className="font-bold">{user.user_metadata.age}</div>
          </div>
        )}
        {user?.user_metadata?.gender && (
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500">Gender</div>
            <div className="font-bold">{user.user_metadata.gender}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, isLoading, reloadUser } = useAuth();
  const router = useRouter();
  
  // Get the singleton Supabase client
  const supabase = getSupabaseClient();
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isUsingLocalAuth, setIsUsingLocalAuth] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  const [healthData, setHealthData] = useState<ProfileFormData>({
    username: '',
    defaultGoal: 'General Wellness',
    height: '',
    weight: '',
    age: '',
    gender: '',
    activityLevel: '',
  });

  // Check if using local auth and setup mode
  useEffect(() => {
    const localAuth = getCookie('use-local-auth') === 'true';
    setIsUsingLocalAuth(localAuth);
    
    const params = new URLSearchParams(window.location.search);
    setShowSetup(params.get('setup') === 'true');
  }, []);

  // Load user data when available
  useEffect(() => {
    if (user) {
      setHealthData({
        username: user.user_metadata?.username || '',
        defaultGoal: user.user_metadata?.defaultGoal || 'General Wellness',
        height: user.user_metadata?.height || '',
        weight: user.user_metadata?.weight || '',
        age: user.user_metadata?.age || '',
        gender: user.user_metadata?.gender || '',
        activityLevel: user.user_metadata?.activityLevel || '',
      });
    }
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setHealthData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    
    try {
      if (isUsingLocalAuth) {
        // Local auth mode - update local storage
        const success = updateLocalProfile({
          username: healthData.username,
          defaultGoal: healthData.defaultGoal,
          height: healthData.height,
          weight: healthData.weight,
          age: healthData.age,
          gender: healthData.gender, 
          activityLevel: healthData.activityLevel,
          profile_completed: true
        });
        
        if (!success) {
          throw new Error('Failed to update local profile');
        }
        
        // Reload user from context to reflect changes
        await reloadUser();
        
        setNotification({
          text: 'Profile updated successfully!',
          type: 'success'
        });
        
        // Redirect after successful update if in setup mode
        setTimeout(() => {
          if (showSetup) {
            const url = new URL(window.location.href);
            url.searchParams.delete('setup');
            router.replace(url.toString());
          }
        }, 1500);
      } else {
        // Regular auth mode - update Supabase user metadata
        const { error } = await supabase.auth.updateUser({
          data: {
            username: healthData.username,
            defaultGoal: healthData.defaultGoal,
            height: healthData.height,
            weight: healthData.weight,
            age: healthData.age,
            gender: healthData.gender,
            activityLevel: healthData.activityLevel,
            profile_completed: true
          }
        });
        
        if (error) throw error;
        
        // Reload user from context to reflect changes
        await reloadUser();
        
        setNotification({
          text: 'Profile updated successfully!',
          type: 'success'
        });
        
        // Redirect after successful update if in setup mode
        setTimeout(() => {
          if (showSetup) {
            const url = new URL(window.location.href);
            url.searchParams.delete('setup');
            router.replace(url.toString());
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        text: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Spinner size="lg" />
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Your Health Profile</h1>
      
      {/* User info card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Personalize Your Experience</h2>
            <p className="opacity-90">{user.email}</p>
          </div>
        </div>
        
        <p className="text-lg mb-3">
          <span className="font-bold">For the most accurate nutrition analysis</span>, please complete your health profile below.
        </p>
        
        <p className="mb-1">✓ All your uploads and history are securely stored in your account</p>
        <p className="mb-1">✓ Your health data is used to provide personalized nutrition recommendations</p>
        <p>✓ Complete all fields for the most tailored analysis results</p>
      </div>
      
      {/* Local auth warning */}
      {isUsingLocalAuth && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> You're using simplified authentication. Your profile changes will be saved locally.
          </p>
        </div>
      )}
      
      {/* Health summary card if data exists */}
      {(healthData.height || healthData.weight || healthData.age || healthData.gender) && (
        <div className="mb-6">
          <UserHealthSummary />
        </div>
      )}
      
      {/* Profile form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Health information section */}
          <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Health Information</h2>
            <p className="text-blue-700 mb-4 font-medium">
              This is the data used to analyze your food photos and provide personalized recommendations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Height field */}
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height <span className="text-blue-600 font-semibold">(important)</span>
                </label>
                <div className="relative">
                  <input
                    id="height"
                    name="height"
                    type="text"
                    value={healthData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Height in inches"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    in
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600">5'10" = 70 inches</p>
              </div>
              
              {/* Weight field */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight <span className="text-blue-600 font-semibold">(important)</span>
                </label>
                <div className="relative">
                  <input
                    id="weight"
                    name="weight"
                    type="text"
                    value={healthData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Weight in pounds"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    lbs
                  </div>
                </div>
              </div>
              
              {/* Age field */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-blue-600 font-semibold">(important)</span>
                </label>
                <input
                  id="age"
                  name="age"
                  type="text"
                  value={healthData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Your age"
                />
              </div>
              
              {/* Gender field */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-blue-600 font-semibold">(important)</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={healthData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              
              {/* Activity level field */}
              <div>
                <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Level <span className="text-blue-600 font-semibold">(important)</span>
                </label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={healthData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="">Select activity level</option>
                  <option value="Sedentary">Sedentary (little to no exercise)</option>
                  <option value="Light">Light (light exercise 1-3 days/week)</option>
                  <option value="Moderate">Moderate (moderate exercise 3-5 days/week)</option>
                  <option value="Active">Active (hard exercise 6-7 days/week)</option>
                  <option value="Very Active">Very Active (intense exercise daily or 2x/day)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Other profile fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={healthData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Your username"
              />
            </div>
            
            {/* Goal field */}
            <div>
              <label htmlFor="defaultGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Nutritional Goal
              </label>
              <select
                id="defaultGoal"
                name="defaultGoal"
                value={healthData.defaultGoal}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              >
                <option value="General Wellness">General Wellness</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="Heart Health">Heart Health</option>
                <option value="Blood Sugar Management">Blood Sugar Management</option>
              </select>
            </div>
          </div>
          
          {/* Submit button and notification */}
          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Health Profile'}
            </button>
            
            {notification && (
              <div className={`mt-4 p-3 rounded ${
                notification.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {notification.text}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function for local profile updates
function updateLocalProfile(profileData) {
  try {
    // Get current user data from localStorage or initialize empty object
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Update user metadata
    userData.user_metadata = {
      ...userData.user_metadata,
      ...profileData
    };
    
    // Save updated user data
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
      detail: { userData } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error updating local profile:', error);
    return false;
  }
} 