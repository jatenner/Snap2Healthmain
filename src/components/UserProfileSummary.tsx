'use client';

import React from 'react';
import { useAuth } from '@/context/auth';
import { FaUser, FaRuler, FaWeight, FaCalendar } from 'react-icons/fa';
import { BiBody } from 'react-icons/bi';

interface UserProfileSummaryProps {
  showTitle?: boolean;
  compact?: boolean;
}

const UserProfileSummary: React.FC<UserProfileSummaryProps> = ({ 
  showTitle = true,
  compact = false
}) => {
  const { user } = useAuth();
  
  // Extract user metadata
  const metadata = user?.user_metadata || {};
  const { 
    username = 'User',
    height = '',
    weight = '',
    age = '',
    gender = '',
    defaultGoal = 'General Wellness'
  } = metadata;

  // Calculate BMI if height and weight are available
  const calculateBMI = () => {
    if (!height || !weight) return null;
    
    const heightInches = parseFloat(height);
    const weightLbs = parseFloat(weight);
    
    if (isNaN(heightInches) || isNaN(weightLbs) || heightInches <= 0 || weightLbs <= 0) {
      return null;
    }
    
    // BMI formula: (weight in kg / height in meters squared)
    // Convert pounds to kg: pounds / 2.20462
    // Convert inches to meters: inches * 0.0254
    const weightKg = weightLbs / 2.20462;
    const heightM = heightInches * 0.0254;
    
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  // Determine colors based on BMI
  const getBMIColor = () => {
    if (!bmi) return 'text-gray-400';
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return 'text-blue-400';
    if (bmiValue < 25) return 'text-green-400';
    if (bmiValue < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Estimate daily calorie needs using Mifflin-St Jeor equation
  const estimateDailyCalories = () => {
    if (!height || !weight || !age || !gender) return null;
    
    const heightInches = parseFloat(height);
    const weightLbs = parseFloat(weight);
    const ageYears = parseFloat(age);
    
    if (isNaN(heightInches) || isNaN(weightLbs) || isNaN(ageYears)) {
      return null;
    }
    
    // Convert to metric
    const heightCm = heightInches * 2.54;
    const weightKg = weightLbs / 2.20462;
    
    // Base metabolic rate calculation
    let bmr;
    if (gender.toLowerCase() === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    
    // Assuming moderate activity level (factor of 1.55)
    return Math.round(bmr * 1.55);
  };

  const dailyCalories = estimateDailyCalories();

  // If compact mode, show minimal version
  if (compact) {
    return (
      <div className="bg-darkBlue-secondary/60 border border-darkBlue-accent/40 rounded-lg p-3 text-blue-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Your Health Profile</h3>
          <span className="text-cyan-accent">{defaultGoal}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {height && <div><span className="text-blue-300">Height:</span> {height}″</div>}
          {weight && <div><span className="text-blue-300">Weight:</span> {weight} lbs</div>}
          {bmi && <div><span className="text-blue-300">BMI:</span> <span className={getBMIColor()}>{bmi}</span></div>}
          {dailyCalories && <div><span className="text-blue-300">Est. daily:</span> {dailyCalories} cal</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 rounded-lg overflow-hidden">
      {showTitle && (
        <div className="bg-darkBlue-accent/20 border-b border-darkBlue-accent/40 px-4 py-3">
          <h3 className="font-semibold text-cyan-accent">Your Health Profile</h3>
        </div>
      )}
      
      <div className="p-4 text-blue-100">
        <div className="flex items-center mb-4">
          <div className="bg-darkBlue-accent/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
            <FaUser className="text-cyan-accent" />
          </div>
          <div>
            <div className="font-medium text-lg">{username}</div>
            <div className="text-sm text-blue-300">{defaultGoal}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-5">
          {height && (
            <div className="flex items-center">
              <FaRuler className="text-cyan-accent mr-2" />
              <div>
                <div className="text-sm text-blue-300">Height</div>
                <div>{height} inches</div>
              </div>
            </div>
          )}
          
          {weight && (
            <div className="flex items-center">
              <FaWeight className="text-cyan-accent mr-2" />
              <div>
                <div className="text-sm text-blue-300">Weight</div>
                <div>{weight} lbs</div>
              </div>
            </div>
          )}
          
          {age && (
            <div className="flex items-center">
              <FaCalendar className="text-cyan-accent mr-2" />
              <div>
                <div className="text-sm text-blue-300">Age</div>
                <div>{age} years</div>
              </div>
            </div>
          )}
          
          {gender && (
            <div className="flex items-center">
              <BiBody className="text-cyan-accent mr-2" />
              <div>
                <div className="text-sm text-blue-300">Gender</div>
                <div>{gender}</div>
              </div>
            </div>
          )}
        </div>
        
        {bmi && (
          <div className="bg-darkBlue-accent/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-300">BMI</span>
              <span className={`font-semibold ${getBMIColor()}`}>{bmi} - {bmiCategory}</span>
            </div>
            <div className="w-full bg-darkBlue-accent/30 h-2 rounded-full">
              <div 
                className={`h-2 rounded-full ${getBMIColor().replace('text-', 'bg-')}`} 
                style={{ width: `${Math.min(parseFloat(bmi) * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {dailyCalories && (
          <div className="bg-darkBlue-accent/20 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-300">Estimated Daily Calories</span>
              <span className="font-semibold text-cyan-accent">{dailyCalories}</span>
            </div>
            <div className="text-xs text-blue-300/80 mt-1">
              Based on your profile with moderate activity
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileSummary; 