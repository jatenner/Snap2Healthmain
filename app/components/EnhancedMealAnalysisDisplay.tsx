'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Target, Lightbulb, AlertTriangle, ChefHat, Activity, Flame, Heart, ArrowLeft, Utensils, BarChart3, Brain, Star, Zap, Shield, TrendingUp, AlertCircle, Info, CheckCircle2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number | null;
  description?: string;
}

export interface MealAnalysisData {
  id?: string;
  mealName: string;
  mealDescription?: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  foods?: string[];
  ingredients?: string[];
  macronutrients: Nutrient[];
  micronutrients: Nutrient[];
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  personalizedHealthInsights?: string;
  expertRecommendations?: string[];
  metabolicInsights?: string;
  goal?: string;
  // Creative fields from OpenAI
  mealStory?: string;
  nutritionalNarrative?: string;
  healthScore?: string | number;
  timeOfDayOptimization?: string;
  // Enhanced analysis fields
  visualAnalysis?: string;
  cookingMethod?: string;
  culturalContext?: string;
  healthRating: number;
  // Analysis object that contains the raw response data
  analysis?: {
    personalized_health_insights?: string;
    metabolic_insights?: string;
    nutritional_narrative?: string;
    meal_story?: string;
    time_of_day_optimization?: string;
    expert_recommendations?: string[];
    benefits?: string[];
    concerns?: string[];
    suggestions?: string[];
    [key: string]: any;
  };
}

export interface UserProfile {
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  activityLevel?: string;
  goal?: string;
  healthGoal?: string;
  dietaryRestrictions?: string[];
}

interface EnhancedMealAnalysisDisplayProps {
  mealData: MealAnalysisData;
  userProfile?: UserProfile;
  isLoading?: boolean;
  error?: string | null;
  onClose?: () => void;
  showSaveButton?: boolean;
  onSaveMeal?: (mealData: MealAnalysisData) => void | Promise<void>;
  initialTab?: 'nutrients' | 'ai';
  className?: string;
}

// Theme colors for consistent dark theme
const THEME_COLORS = {
  background: 'bg-slate-900',
  surface: 'bg-slate-800',
  surfaceLight: 'bg-slate-700',
  text: 'text-slate-100',
  textMuted: 'text-slate-400',
  border: 'border-slate-600',
  accent: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  gradients: {
    protein: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    carbs: 'bg-gradient-to-r from-blue-600 to-blue-700',
    fat: 'bg-gradient-to-r from-amber-600 to-amber-700',
    calories: 'bg-gradient-to-r from-indigo-600 to-purple-600'
  }
};

// Standard Daily Values (FDA guidelines) - fallback when no user profile
const STANDARD_DAILY_VALUES: { [key: string]: number } = {
  'protein': 50,
  'carbohydrates': 300,
  'carbs': 300,
  'total fat': 65,
  'fat': 65,
  'saturated fat': 20,
  'dietary fiber': 25,
  'fiber': 25,
  'sodium': 2300,
  'total sugars': 50,
  'sugar': 50,
  'calcium': 1300,
  'iron': 18,
  'potassium': 4700,
  'vitamin a': 900,
  'vitamin c': 90,
  'vitamin d': 20
};

// Personalized Daily Values calculation based on user profile
const calculatePersonalizedDV = (nutrientName: string, userProfile?: UserProfile): number => {
  if (!userProfile) {
    // Fallback to FDA standards if no profile
    return STANDARD_DAILY_VALUES[nutrientName.toLowerCase()] || 0;
  }

  const baseValue = STANDARD_DAILY_VALUES[nutrientName.toLowerCase()] || 0;
  
  // Age adjustments
  let ageMultiplier = 1;
  if (userProfile.age) {
    if (userProfile.age < 19) ageMultiplier = 0.85;
    else if (userProfile.age > 50) ageMultiplier = 1.1;
  }

  // Gender adjustments
  let genderMultiplier = 1;
  if (userProfile.gender?.toLowerCase() === 'male') {
    genderMultiplier = 1.15;
  } else if (userProfile.gender?.toLowerCase() === 'female') {
    genderMultiplier = 0.9;
  }

  // Activity level adjustments
  let activityMultiplier = 1;
  if (userProfile.activityLevel) {
    switch (userProfile.activityLevel.toLowerCase()) {
      case 'sedentary': activityMultiplier = 0.9; break;
      case 'light': activityMultiplier = 1; break;
      case 'moderate': activityMultiplier = 1.1; break;
      case 'active': activityMultiplier = 1.2; break;
      case 'very active': activityMultiplier = 1.3; break;
    }
  }

  return Math.round(baseValue * ageMultiplier * genderMultiplier * activityMultiplier);
};

// Simple nutrient card without detailed explanations
const NutrientCard = ({ nutrient, userProfile, className = '' }: { 
  nutrient: Nutrient; 
  userProfile?: UserProfile;
  className?: string; 
}) => {
  const getNutrientIcon = (name: string) => {
    const iconName = name.toLowerCase();
    if (iconName.includes('protein')) return <Zap className="w-4 h-4" />;
    if (iconName.includes('carb') || iconName.includes('fiber')) return <BarChart3 className="w-4 h-4" />;
    if (iconName.includes('fat')) return <Shield className="w-4 h-4" />;
    if (iconName.includes('vitamin') || iconName.includes('mineral')) return <Star className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getProgressColor = (percentage: number | null) => {
    if (!percentage) return 'bg-gray-600';
    if (percentage < 25) return 'bg-red-500';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getBadgeColor = (percentage: number | null) => {
    if (!percentage) return 'bg-gray-700 text-gray-300';
    if (percentage < 25) return 'bg-red-900/30 text-red-300';
    if (percentage < 50) return 'bg-yellow-900/30 text-yellow-300';
    if (percentage < 100) return 'bg-blue-900/30 text-blue-300';
    return 'bg-green-900/30 text-green-300';
  };

  return (
    <div className={`${THEME_COLORS.surface} rounded-xl p-4 ${THEME_COLORS.border} border ${className}`}>
      {/* Nutrient Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-blue-400">
            {getNutrientIcon(nutrient.name)}
          </div>
          <h4 className={`font-medium ${THEME_COLORS.text} text-sm`}>
            {nutrient.name}
          </h4>
        </div>
        {nutrient.percentDailyValue && (
          <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(nutrient.percentDailyValue)}`}>
            {nutrient.percentDailyValue}% DV
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="mb-3">
        <span className={`text-2xl font-bold ${THEME_COLORS.text}`}>
          {nutrient.amount}
        </span>
        <span className={`text-sm ${THEME_COLORS.textMuted} ml-1`}>
          {nutrient.unit}
        </span>
      </div>

      {/* Progress Bar */}
      {nutrient.percentDailyValue && (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(nutrient.percentDailyValue)}`}
            style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Clean profile display
const ProfileCard = ({ userProfile }: { userProfile?: UserProfile }) => {
  if (!userProfile) return null;

  return (
    <div className={`${THEME_COLORS.surface} rounded-xl p-4 h-fit`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-12 h-12 ${THEME_COLORS.gradients.calories} rounded-full flex items-center justify-center`}>
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className={`font-semibold ${THEME_COLORS.text}`}>Your Profile</h3>
          <p className={`text-sm ${THEME_COLORS.textMuted}`}>Personalized insights</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className={`text-sm ${THEME_COLORS.textMuted}`}>Age</span>
          <span className={`font-medium ${THEME_COLORS.text}`}>{userProfile.age || 'N/A'} years old</span>
        </div>
        <div className="flex justify-between">
          <span className={`text-sm ${THEME_COLORS.textMuted}`}>Gender</span>
          <span className={`font-medium ${THEME_COLORS.text} capitalize`}>{userProfile.gender || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className={`text-sm ${THEME_COLORS.textMuted}`}>Weight</span>
          <span className={`font-medium ${THEME_COLORS.text}`}>{userProfile.weight || 'N/A'} lbs</span>
        </div>
        <div className="flex justify-between">
          <span className={`text-sm ${THEME_COLORS.textMuted}`}>Height</span>
          <span className={`font-medium ${THEME_COLORS.text}`}>{userProfile.height || 'N/A'}</span>
        </div>
        {userProfile.goal && (
          <div className="pt-2 border-t border-slate-600">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className={`text-sm font-medium ${THEME_COLORS.success}`}>Goal: {userProfile.goal}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedMealAnalysisDisplay: React.FC<EnhancedMealAnalysisDisplayProps> = ({
  mealData,
  userProfile,
  isLoading,
  error,
  onClose,
  showSaveButton = true,
  onSaveMeal,
  initialTab = 'nutrients',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'nutrients' | 'ai'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (onSaveMeal && !isSaving) {
      setIsSaving(true);
      try {
        onSaveMeal(mealData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${THEME_COLORS.background} flex items-center justify-center`}>
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className={THEME_COLORS.text}>Analyzing your meal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${THEME_COLORS.background} flex items-center justify-center`}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className={`${THEME_COLORS.text} mb-4`}>Error loading meal analysis</p>
          <p className={`${THEME_COLORS.textMuted} text-sm`}>{error}</p>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const getMainMacros = () => {
    return [
      {
        name: 'Protein',
        amount: mealData.protein,
        unit: 'g',
        color: THEME_COLORS.gradients.protein,
        icon: <Zap className="w-6 h-6" />
      },
      {
        name: 'Carbs',
        amount: mealData.carbs,
        unit: 'g',
        color: THEME_COLORS.gradients.carbs,
        icon: <BarChart3 className="w-6 h-6" />
      },
      {
        name: 'Fat',
        amount: mealData.fat,
        unit: 'g',
        color: THEME_COLORS.gradients.fat,
        icon: <Shield className="w-6 h-6" />
      }
    ];
  };

  return (
    <div className={`min-h-screen ${THEME_COLORS.background} ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className={`${THEME_COLORS.text} hover:${THEME_COLORS.surfaceLight}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className={`text-xl font-bold ${THEME_COLORS.text}`}>Meal Analysis</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Meal Header */}
        <div className={`${THEME_COLORS.surface} rounded-2xl p-8 mb-8 ${THEME_COLORS.border} border`}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Meal Image */}
            <div className="lg:col-span-1">
              <div className="aspect-square rounded-xl overflow-hidden">
                {mealData.imageUrl ? (
                  <Image
                    src={mealData.imageUrl}
                    alt={mealData.mealName}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${THEME_COLORS.surfaceLight} flex items-center justify-center`}>
                    <ChefHat className={`w-16 h-16 ${THEME_COLORS.textMuted}`} />
                  </div>
                )}
              </div>
            </div>

            {/* Meal Info */}
            <div className="lg:col-span-2">
              <h1 className={`text-3xl font-bold ${THEME_COLORS.text} mb-2`}>
                {mealData.mealName}
              </h1>
              <p className={`text-lg ${THEME_COLORS.textMuted}`}>
                {mealData.mealDescription || 'A delicious and nutritious meal'}
              </p>

              {/* Calories */}
              <div className={`${THEME_COLORS.gradients.calories} rounded-xl p-4 text-center`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Flame className="w-6 h-6 text-white" />
                  <span className="text-white font-medium">Total Calories</span>
                </div>
                <span className="text-4xl font-bold text-white">{mealData.calories}</span>
              </div>

              {/* Main Macros */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {getMainMacros().map((macro) => (
                  <div key={macro.name} className={`${macro.color} rounded-xl p-4 text-center text-white`}>
                    <div className="flex items-center justify-center mb-2">
                      {macro.icon}
                    </div>
                    <div className="text-2xl font-bold">{macro.amount}{macro.unit}</div>
                    <div className="text-sm opacity-90">{macro.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('nutrients')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'nutrients'
                ? `${THEME_COLORS.surface} ${THEME_COLORS.text} shadow-lg`
                : `${THEME_COLORS.textMuted} hover:${THEME_COLORS.text}`
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Nutrition Facts
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'ai'
                ? `${THEME_COLORS.surface} ${THEME_COLORS.text} shadow-lg`
                : `${THEME_COLORS.textMuted} hover:${THEME_COLORS.text}`
            }`}
          >
            <Brain className="w-5 h-5 inline mr-2" />
            AI Insights
          </button>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {activeTab === 'nutrients' && (
            <div className="space-y-6">
              {/* Macronutrients */}
              <div className={`${THEME_COLORS.surface} rounded-xl p-6`}>
                <h3 className={`text-xl font-bold ${THEME_COLORS.text} mb-6 flex items-center`}>
                  <Zap className="w-6 h-6 mr-3 text-green-400" />
                  Macronutrients
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mealData.macronutrients?.map((macro, index) => (
                    <NutrientCard key={index} nutrient={macro} userProfile={userProfile} />
                  ))}
                </div>
              </div>

              {/* Micronutrients */}
              <div className={`${THEME_COLORS.surface} rounded-xl p-6`}>
                <h3 className={`text-xl font-bold ${THEME_COLORS.text} mb-6 flex items-center`}>
                  <Shield className="w-6 h-6 mr-3 text-blue-400" />
                  Micronutrients & Vitamins
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mealData.micronutrients?.map((micro, index) => (
                    <NutrientCard key={index} nutrient={micro} userProfile={userProfile} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Overall Meal Assessment */}
              <div className={`${THEME_COLORS.surface} rounded-xl p-6 border-l-4 border-blue-500`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className={`w-6 h-6 text-blue-400`} />
                  <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>Personalized Analysis</h3>
                </div>
                
                <div className={`${THEME_COLORS.textMuted} leading-relaxed space-y-4`}>
                  <div>
                    <h4 className={`text-lg font-semibold ${THEME_COLORS.text} mb-2 flex items-center`}>
                      <Target className="w-5 h-5 mr-2 text-green-400" />
                      Energy & Macronutrient Impact
                    </h4>
                    <p>
                      This meal provides <strong className="text-orange-400">{mealData.calories} calories</strong> with 
                      <strong className="text-green-400"> {mealData.protein}g protein</strong>, 
                      <strong className="text-blue-400"> {mealData.carbs}g carbohydrates</strong>, and 
                      <strong className="text-orange-400"> {mealData.fat}g fat</strong>.
                      {userProfile?.weight && (
                        <> For your {userProfile.weight}lb body weight, this provides approximately {(mealData.protein / (userProfile.weight * 0.453592)).toFixed(1)}g protein per kg body weight.</>
                      )}
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <p><strong className="text-green-400">Protein Impact:</strong> {mealData.protein >= 25 ? 'Excellent protein content! This amount will effectively stimulate muscle protein synthesis and support recovery. Your body can utilize this protein efficiently for muscle repair and growth.' : 'Moderate protein content. Consider adding lean protein sources to optimize muscle protein synthesis.'}</p>
                      
                      <p><strong className="text-blue-400">Energy & Blood Sugar:</strong> {mealData.carbs > 50 ? 'Moderate to high carb content should provide steady energy. The carbs will be converted to glucose, potentially causing a blood sugar rise within 30-60 minutes.' : 'Lower carb content should provide steady energy without dramatic blood sugar spikes. This is well-balanced for most people.'}</p>
                      
                      <p><strong className="text-orange-400">Fat Quality & Satiation:</strong> {mealData.fat > 20 ? 'Higher fat content will keep you satisfied for hours and support hormone production. Make sure these are quality fats - olive oil, avocado, nuts, or fatty fish work best.' : 'Moderate fat content provides sustained energy and supports nutrient absorption.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Happens in Your Body */}
              <div className={`${THEME_COLORS.surface} rounded-xl p-6 border-l-4 border-purple-500`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className={`w-6 h-6 text-purple-400`} />
                  <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>What Happens in Your Body</h3>
                </div>
                
                <div className={`${THEME_COLORS.textMuted} leading-relaxed space-y-4`}>
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-purple-300`}>First 30 minutes:</h4>
                    <p>Your digestive system breaks down this meal, with carbs converting to glucose first. You'll likely see a blood sugar rise, triggering insulin release to shuttle nutrients into cells.</p>
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-purple-300`}>1-2 hours:</h4>
                    <p>Protein amino acids enter your bloodstream, supporting muscle repair and neurotransmitter production. This protein amount will keep muscle protein synthesis elevated for 3-4 hours.</p>
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-purple-300`}>2-4 hours:</h4>
                    <p>Fats provide sustained energy and support hormone production. The fat content will help you feel satisfied and support absorption of fat-soluble vitamins.</p>
                  </div>
                  
                  {userProfile?.goal && (
                    <div>
                      <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-purple-300`}>For your {userProfile.goal.toLowerCase()} goal:</h4>
                      <p>
                        {userProfile.goal.toLowerCase().includes('athletic') || userProfile.goal.toLowerCase().includes('performance') 
                          ? 'The protein supports muscle growth and recovery. Consider timing this meal within 2 hours post-workout for optimal muscle protein synthesis.'
                          : userProfile.goal.toLowerCase().includes('weight') || userProfile.goal.toLowerCase().includes('fat')
                          ? 'The protein and fat combination will help maintain satiety and preserve muscle mass during your weight management journey.'
                          : 'This balanced meal supports your general health goals with quality nutrients for sustained energy and wellness.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Tips */}
              <div className={`${THEME_COLORS.surface} rounded-xl p-6 border-l-4 border-yellow-500`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Lightbulb className={`w-6 h-6 text-yellow-400`} />
                  <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>Simple Ways to Optimize</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-yellow-300`}>Post-Meal Movement:</h4>
                    <p className={`${THEME_COLORS.textMuted}`}>
                      With {mealData.carbs}g of carbs, a 10-15 minute walk after eating can help your muscles use glucose more efficiently, reducing blood sugar spikes by 20-30%.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-yellow-300`}>Timing Matters:</h4>
                    <p className={`${THEME_COLORS.textMuted}`}>
                      {userProfile?.goal?.toLowerCase().includes('athletic') || userProfile?.goal?.toLowerCase().includes('performance')
                        ? 'For muscle building, consume this within 2 hours post-workout when your muscles are primed for nutrient uptake.'
                        : 'This meal works well for breakfast or lunch when your metabolism is most active and can efficiently process the nutrients.'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold ${THEME_COLORS.text} mb-2 text-yellow-300`}>Hydration:</h4>
                    <p className={`${THEME_COLORS.textMuted}`}>
                      Drink 16-20oz of water with this meal to support digestion, nutrient transport, and help your kidneys process the protein efficiently.
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Takeaways */}
              <div className={`${THEME_COLORS.surfaceLight} rounded-xl p-6`}>
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className={`w-6 h-6 text-green-400`} />
                  <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>Key Takeaways</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className={`font-semibold ${THEME_COLORS.text} text-green-300`}>✅ What's Working Well</h4>
                    {mealData.benefits?.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className={`${THEME_COLORS.textMuted} text-sm`}>{benefit}</p>
                      </div>
                    )) || (
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className={`${THEME_COLORS.textMuted} text-sm`}>Excellent protein content supports muscle health and satiation</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className={`font-semibold ${THEME_COLORS.text} text-orange-300`}>⚠️ Areas to Consider</h4>
                    {mealData.concerns?.map((concern, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <p className={`${THEME_COLORS.textMuted} text-sm`}>{concern}</p>
                      </div>
                    )) || (
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <p className={`${THEME_COLORS.textMuted} text-sm`}>Well-portioned meal that fits most daily calorie goals</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expert Analysis */}
              {(mealData.personalizedHealthInsights || mealData.analysis?.personalized_health_insights) && (
                <div className={`${THEME_COLORS.surface} rounded-xl p-6 border-l-4 border-indigo-500`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Star className={`w-6 h-6 text-indigo-400`} />
                    <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>Expert Analysis</h3>
                  </div>
                  
                  <div className={`${THEME_COLORS.textMuted} leading-relaxed`}>
                    <p>{mealData.personalizedHealthInsights || mealData.analysis?.personalized_health_insights}</p>
                  </div>
                </div>
              )}

              {/* Metabolic Impact */}
              {(mealData.metabolicInsights || mealData.analysis?.metabolic_insights) && (
                <div className={`${THEME_COLORS.surface} rounded-xl p-6 border-l-4 border-red-500`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Zap className={`w-6 h-6 text-red-400`} />
                    <h3 className={`text-xl font-bold ${THEME_COLORS.text}`}>Metabolic Impact</h3>
                  </div>
                  
                  <div className={`${THEME_COLORS.textMuted} leading-relaxed`}>
                    <p>{mealData.metabolicInsights || mealData.analysis?.metabolic_insights}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        {showSaveButton && onSaveMeal && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Meal Analysis'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMealAnalysisDisplay; 