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
  
  // Calculate BMI if height and weight are available
  const calculateBMI = () => {
    if (!userData?.height || !userData?.weight) return null;
    
    const heightInInches = parseFloat(userData.height);
    const weightInPounds = parseFloat(userData.weight);
    
    if (isNaN(heightInInches) || isNaN(weightInPounds) || heightInInches === 0) return null;
    
    // BMI formula: (weight in pounds * 703) / (height in inches)^2
    const bmi = (weightInPounds * 703) / (heightInInches * heightInInches);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  };

  const bmi = calculateBMI();
  
  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-500' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
    return { category: 'Obese', color: 'text-red-500' };
  };

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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Health Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-blue-800 font-medium mb-1">Height</h3>
                <p className="text-2xl font-bold">
                  {userData?.height ? `${userData.height} in` : 'Not set'}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-green-800 font-medium mb-1">Weight</h3>
                <p className="text-2xl font-bold">
                  {userData?.weight ? `${userData.weight} lbs` : 'Not set'}
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-purple-800 font-medium mb-1">Age</h3>
                <p className="text-2xl font-bold">
                  {userData?.age || 'Not set'}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <Badge variant="outline" className="mb-2">
                {userData?.defaultGoal || 'No goal set'}
              </Badge>
              <p className="text-gray-600">{getPersonalizedAdvice()}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="statistics" className="space-y-4">
            {bmi ? (
              <div>
                <h3 className="font-medium mb-2">Body Mass Index (BMI)</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold">{bmi}</span>
                  <span className={getBMICategory(bmi).color}>
                    {getBMICategory(bmi).category}
                  </span>
                </div>
                <Progress value={Math.min((bmi / 40) * 100, 100)} className="h-2 mb-4" />
                <p className="text-sm text-gray-600">
                  BMI provides a simple measure of body weight relative to height.
                </p>
              </div>
            ) : (
              <p className="text-gray-600">Add your height and weight to see your BMI.</p>
            )}
            
            <Separator className="my-4" />
            
            {dailyCalories ? (
              <div>
                <h3 className="font-medium mb-2">Estimated Daily Calories</h3>
                <p className="text-2xl font-bold mb-2">{dailyCalories} calories</p>
                <p className="text-sm text-gray-600">
                  This is an estimate based on your profile for moderate activity level.
                </p>
              </div>
            ) : (
              <p className="text-gray-600">Complete your profile to see estimated daily calorie needs.</p>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <h3 className="font-medium mb-2">Personalized Nutrition Advice</h3>
            <p className="text-gray-600 mb-4">{getPersonalizedAdvice()}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 text-green-700">Recommended Foods</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {userData?.defaultGoal === 'Weight Loss' ? (
                    <>
                      <li>Lean proteins (chicken, fish, tofu)</li>
                      <li>Fibrous vegetables</li>
                      <li>Berries and low-sugar fruits</li>
                      <li>Legumes and beans</li>
                      <li>Greek yogurt</li>
                    </>
                  ) : userData?.defaultGoal === 'Muscle Gain' ? (
                    <>
                      <li>Protein-rich foods (eggs, meat, dairy)</li>
                      <li>Complex carbohydrates (oats, rice, potatoes)</li>
                      <li>Healthy fats (avocados, nuts, olive oil)</li>
                      <li>Nutrient-dense fruits and vegetables</li>
                      <li>Protein supplements if needed</li>
                    </>
                  ) : (
                    <>
                      <li>Colorful vegetables and fruits</li>
                      <li>Whole grains</li>
                      <li>Lean proteins</li>
                      <li>Healthy fats (olive oil, nuts, avocados)</li>
                      <li>Hydrating foods and water</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 text-amber-700">Meal Timing Tips</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {userData?.defaultGoal === 'Athletic Performance' ? (
                    <>
                      <li>Eat carbs 1-4 hours before exercise</li>
                      <li>Consume protein within 30 min after workout</li>
                      <li>Space meals 3-4 hours apart during the day</li>
                      <li>Stay hydrated throughout the day</li>
                    </>
                  ) : userData?.defaultGoal === 'Blood Sugar Management' ? (
                    <>
                      <li>Eat at consistent times daily</li>
                      <li>Don't skip meals, especially breakfast</li>
                      <li>Space carbohydrates throughout the day</li>
                      <li>Consider smaller, more frequent meals</li>
                    </>
                  ) : (
                    <>
                      <li>Eat breakfast within an hour of waking</li>
                      <li>Space meals 3-5 hours apart</li>
                      <li>Consider your hunger cues</li>
                      <li>Avoid eating large meals before bedtime</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileDashboard; 