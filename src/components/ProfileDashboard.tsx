'use client';

import React from 'react';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import UserProfileSummary from './UserProfileSummary';
import { FaList, FaPlus, FaChartLine, FaUtensils, FaRunning, FaHeartbeat, FaAppleAlt } from 'react-icons/fa';
import Link from 'next/link';

const ProfileDashboard: React.FC = () => {
  const { user } = useAuth();
  const userData = user?.user_metadata;
  const metadata = user?.user_metadata || {};
  
  // Extract profile data
  const { 
    height = '',
    weight = '',
    age = '',
    gender = '',
    defaultGoal = 'General Wellness'
  } = metadata;

  // Check if user has completed their profile
  const hasCompletedProfile = height && weight && age && gender;
  
  // Estimate daily calorie needs
  const estimateDailyCalories = () => {
    if (!userData?.height || !userData?.weight || !userData?.age || !userData?.gender) return null;
    
    const height = parseFloat(userData.height);
    const weight = parseFloat(userData.weight);
    const age = parseFloat(userData.age);
    const gender = userData.gender as string;
    
    if (isNaN(height) || isNaN(weight) || isNaN(age)) return null;
    
    // Harris-Benedict equation for BMR (Basal Metabolic Rate)
    let bmr;
    if (gender.toLowerCase() === 'male') {
      bmr = 66 + (6.23 * weight) + (12.7 * height) - (6.8 * age);
    } else {
      bmr = 655 + (4.35 * weight) + (4.7 * height) - (4.7 * age);
    }
    
    // Assuming moderate activity level (multiplier of 1.55)
    return Math.round(bmr * 1.55);
  };

  const dailyCalories = estimateDailyCalories();

  // Get personalized advice based on user profile
  const getPersonalizedAdvice = () => {
    const goal = userData?.defaultGoal as string;
    if (!goal) return "Complete your health profile to get personalized nutrition advice.";
    
    switch (goal) {
      case 'Weight Loss':
        return "Focus on high protein, fiber-rich foods, and maintain a moderate calorie deficit. Regular physical activity will enhance your results.";
      case 'Muscle Gain':
        return "Prioritize protein intake (1.6-2.2g per kg of body weight) and ensure adequate calorie surplus. Include quality carbs for energy and recovery.";
      case 'Athletic Performance':
        return "Timing your nutrition around workouts can optimize performance. Consider carb loading before long-duration activities.";
      case 'Heart Health':
        return "Emphasize unsaturated fats, limit sodium, and include plenty of fiber, fruits, and vegetables in your diet.";
      case 'Blood Sugar Management':
        return "Focus on low glycemic index foods, consistent meal timing, and balanced meals with protein, healthy fats, and complex carbs.";
      default:
        return "Aim for balanced nutrition with diverse whole foods. Include a variety of fruits, vegetables, quality proteins, and healthy fats.";
    }
  };

  return (
    <Card className="mb-6 border-2 border-green-100">
      <CardHeader className="bg-green-50 pb-2">
        <CardTitle className="flex items-center text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Your Current Health Data
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-green-700 font-medium mb-4">
          This is the health information currently being used to personalize your nutrition recommendations.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
            <h3 className="text-blue-800 text-xs font-semibold mb-1">Height</h3>
            <p className="text-xl font-bold text-gray-800">
              {userData?.height ? `${userData.height}″` : '—'}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
            <h3 className="text-green-800 text-xs font-semibold mb-1">Weight</h3>
            <p className="text-xl font-bold text-gray-800">
              {userData?.weight ? `${userData.weight} lbs` : '—'}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
            <h3 className="text-purple-800 text-xs font-semibold mb-1">Age</h3>
            <p className="text-xl font-bold text-gray-800">
              {userData?.age ? `${userData.age}` : '—'}
            </p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
            <h3 className="text-amber-800 text-xs font-semibold mb-1">Goal</h3>
            <p className="text-lg font-bold truncate text-gray-800">
              {userData?.defaultGoal || '—'}
            </p>
          </div>
        </div>
        
        {dailyCalories && (
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-indigo-700">Estimated Daily Calories</div>
                <div className="text-lg font-bold">{dailyCalories}</div>
              </div>
              <div className="text-sm text-indigo-600">Based on your profile</div>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-800">Personalized Recommendation</h4>
              <p className="text-gray-600 text-sm mt-1">{getPersonalizedAdvice()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileDashboard; 