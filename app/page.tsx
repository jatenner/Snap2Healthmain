'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FoodUpload from '@/components/FoodUpload';
import NutritionAnalysis from '@/components/NutritionAnalysis';
import HealthInsights from '@/components/HealthInsights';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isMobileDevice, isIOSDevice } from '@/utils/deviceDetection';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabaseClient';
import UserProfileSummary from '@/components/UserProfileSummary';

// Enhanced mock data for demo purposes
const mockNutritionData = {
  calories: 180,
  macronutrients: [
    {
      name: "Protein",
      amount: 3.6,
      unit: "g",
      percentDailyValue: 7,
      description: "Small amount for cell repair and maintenance"
    },
    {
      name: "Carbohydrates",
      amount: 42.5,
      unit: "g",
      percentDailyValue: 14,
      description: "Primarily natural sugars with some fiber"
    },
    {
      name: "Fat",
      amount: 0.4,
      unit: "g",
      percentDailyValue: 1,
      description: "Very low fat content"
    },
    {
      name: "Fiber",
      amount: 9.6,
      unit: "g",
      percentDailyValue: 34,
      description: "Supports digestive health and steady blood sugar"
    },
    {
      name: "Sugar",
      amount: 33.6,
      unit: "g",
      percentDailyValue: 37,
      description: "Natural fruit sugars (fructose, glucose, and sucrose)"
    },
    {
      name: "Sodium",
      amount: 0,
      unit: "mg",
      percentDailyValue: 0,
      description: "Virtually no sodium content"
    }
  ],
  micronutrients: [
    {
      name: "Vitamin C",
      amount: 200,
      unit: "mg",
      percentDailyValue: 222,
      description: "Powerful antioxidant supporting immune function"
    },
    {
      name: "Folate",
      amount: 120,
      unit: "mcg",
      percentDailyValue: 30,
      description: "Essential for cell division and DNA synthesis"
    },
    {
      name: "Potassium",
      amount: 664,
      unit: "mg",
      percentDailyValue: 14,
      description: "Supports healthy blood pressure and fluid balance"
    },
    {
      name: "Vitamin A",
      amount: 648,
      unit: "IU",
      percentDailyValue: 13,
      description: "Supports vision and immune function"
    },
    {
      name: "Calcium",
      amount: 104,
      unit: "mg",
      percentDailyValue: 10,
      description: "Supports bone health"
    }
  ],
  hydration: {
    level: 87,
    waterContent: 162,
    unit: "ml",
    tips: [
      "Oranges are 87% water, making them excellent for hydration",
      "Good source of electrolytes to support hydration"
    ]
  },
  glycemicLoad: {
    value: 5,
    index: 43,
    carbs: 42.5,
    unit: "g",
    foodTypes: ["Fresh whole oranges", "Natural fruit sugars"],
    impact: "Moderate glycemic index with fiber that helps manage blood sugar response"
  },
  recoveryInsights: [
    {
      title: "Immune Support",
      description: "The high vitamin C content helps support immune function and reduce oxidative stress."
    },
    {
      title: "Natural Energy",
      description: "Natural fruit sugars provide quick energy while fiber helps maintain steady blood sugar levels."
    },
    {
      title: "Hydration Benefits",
      description: "High water content (87%) helps with hydration and recovery after physical activity."
    }
  ]
};

const mockHealthInsights = [
  "Excellent source of vitamin C (222% DV)",
  "Good source of dietary fiber (34% DV)",
  "Contains natural antioxidants like hesperidin",
  "High water content supports hydration"
];

const mockConcerns = [
  "High in natural sugars (33.6g)",
  "May trigger symptoms in those with citrus sensitivity"
];

const mockSuggestions = [
  "Eat whole oranges rather than juice to get the fiber benefits",
  "Include the white pith under the peel for additional flavonoids",
  "Pair with a source of protein for a more balanced snack"
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [healthGoal, setHealthGoal] = useState('General Wellness');
  const [error, setError] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<any>(mockNutritionData);
  const [mealCaption, setMealCaption] = useState<string>('Oranges');
  const [resultsFadeIn, setResultsFadeIn] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Check device on component mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsIOS(isIOSDevice());
    
    // Set default health goal from user profile if available
    if (user?.user_metadata?.defaultGoal) {
      setHealthGoal(user.user_metadata.defaultGoal);
    }
  }, [user]);

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          // Get user metadata from Supabase
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.user_metadata) {
            setUserProfile(userData.user.user_metadata);
            // Set default health goal if available
            if (userData.user.user_metadata.defaultGoal) {
              setHealthGoal(userData.user.user_metadata.defaultGoal);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // Add fade-in effect after results are shown
  useEffect(() => {
    if (showResults) {
      // Slight delay for the fade-in effect
      const timer = setTimeout(() => {
        setResultsFadeIn(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showResults]);
  
  // Ensure we have recommendations data
  useEffect(() => {
    if (analysisComplete && (!nutritionData.recommendations || nutritionData.recommendations.length === 0)) {
      // Generate personalized recommendations based on user profile
      const personalizedRecommendations = generatePersonalizedRecommendations(
        nutritionData,
        healthGoal,
        userProfile
      );
      
      setNutritionData((prevData: typeof mockNutritionData) => ({
        ...prevData,
        recommendations: personalizedRecommendations
      }));
    }
  }, [analysisComplete, nutritionData.recommendations, healthGoal, userProfile]);
  
  // Function to generate personalized recommendations based on user profile and meal data
  const generatePersonalizedRecommendations = (mealData: any, goal: string, profile: any) => {
    // Start with default recommendations
    let recommendations = [...mockSuggestions];
    
    // If we don't have user profile data, return default recommendations
    if (!profile) {
      return recommendations;
    }
    
    // Add additional recommendations based on user demographic info
    const { age, weight, height, gender } = profile;
    
    // Recommendations based on meal content and general nutritional principles
    const hasFruit = mealData.caption?.toLowerCase().includes('orange') || mealData.caption?.toLowerCase().includes('fruit');
    const highVitaminC = mealData.micronutrients?.some((nutrient: any) => 
      nutrient.name === "Vitamin C" && nutrient.percentDailyValue > 100);
    const highFiber = mealData.macronutrients?.some((nutrient: any) => 
      nutrient.name === "Fiber" && nutrient.percentDailyValue > 25);
    const highSugar = mealData.macronutrients?.some((nutrient: any) => 
      nutrient.name === "Sugar" && nutrient.percentDailyValue > 25);
    
    // Core nutrition recommendations based on meal content
    if (hasFruit) {
      recommendations.push("Excellent choice including fruit in your meal for essential vitamins");
    }
    
    if (highVitaminC) {
      recommendations.push("Your meal is high in vitamin C, which supports immune function");
    }
    
    if (highFiber) {
      recommendations.push("The fiber content in this meal supports digestive health");
    }
    
    if (highSugar) {
      recommendations.push("Be mindful of the natural sugar content - pair with protein to balance blood sugar response");
    }
    
    // Recommendations based on age
    if (age) {
      const ageNum = parseInt(age, 10);
      if (!isNaN(ageNum)) {
        if (ageNum > 60) {
          recommendations.push("At your age, focus on calcium and vitamin D rich foods to maintain bone health");
          
          if (highFiber) {
            recommendations.push("The fiber in this meal is especially beneficial for digestive health as we age");
          }
        }
        else if (ageNum > 50) {
          recommendations.push("Include calcium-rich foods regularly to support bone health as you age");
          
          if (highVitaminC) {
            recommendations.push("The vitamin C in this meal supports collagen production, beneficial for skin health in your 50s");
          }
        }
        else if (ageNum > 40) {
          recommendations.push("Consider adding antioxidant-rich foods to your diet for cellular health");
          
          if (hasFruit) {
            recommendations.push("Fruits like these provide valuable antioxidants that can help combat oxidative stress");
          }
        }
        else if (ageNum > 30) {
          recommendations.push("Focus on maintaining metabolic health with balanced meals");
        }
        else if (ageNum > 18) {
          if (goal === "Muscle Gain") {
            recommendations.push("Your age is optimal for muscle development with sufficient protein intake");
          } else {
            recommendations.push("Establish healthy eating patterns now for long-term health benefits");
          }
        } else {
          recommendations.push("Growing bodies need consistent, nutrient-dense foods");
        }
      }
    }
    
    // Recommendations based on weight and height (basic BMI-related)
    if (weight && height) {
      try {
        const weightLbs = parseFloat(weight);
        const heightInches = parseFloat(height);
        if (!isNaN(weightLbs) && !isNaN(heightInches) && heightInches > 0) {
          // BMI formula for imperial units: (weight in pounds * 703) / (height in inches)²
          const bmi = (weightLbs * 703) / (heightInches * heightInches);
          
          if (bmi < 18.5) {
            recommendations.push("Based on your BMI, focus on nutrient-dense foods to support healthy weight");
            
            if (hasFruit) {
              recommendations.push("While fruits are nutritious, pair with protein and healthy fats for more calories");
            }
          } else if (bmi >= 25 && bmi < 30) {
            recommendations.push("Consider portion control and increasing fiber intake for satiety");
            
            if (highFiber) {
              recommendations.push("The fiber in this meal can help you feel full longer, supporting weight management");
            }
            
            if (highSugar) {
              recommendations.push("Be mindful of sugar intake, even from natural sources, for weight management");
            }
          } else if (bmi >= 30) {
            recommendations.push("Include more vegetables and lean proteins to support weight management");
            
            if (hasFruit) {
              recommendations.push("Consider balancing fruit with more protein and vegetables for better satiety");
            }
          } else {
            // Normal BMI
            recommendations.push("Your BMI is in the healthy range - focus on maintaining balanced nutrition");
          }
        }
      } catch (error) {
        console.error("Error calculating BMI:", error);
      }
    }
    
    // Gender-specific recommendations
    if (gender) {
      if (gender === "Female") {
        recommendations.push("Include iron-rich foods regularly to support your nutritional needs");
        
        if (highVitaminC) {
          recommendations.push("Vitamin C enhances iron absorption, which is particularly beneficial for women");
        }
      } else if (gender === "Male" && goal === "Muscle Gain") {
        recommendations.push("Your protein needs may be higher to support muscle development");
        
        if (hasFruit) {
          recommendations.push("Fruit provides carbohydrates that can support recovery after workouts");
        }
      }
    }
    
    // Goal-specific additions
    if (goal === "Weight Loss") {
      recommendations.push("Focus on foods with high nutrient density but lower calorie content");
      
      if (highFiber) {
        recommendations.push("The fiber content helps with satiety, which can support your weight loss goals");
      }
    } else if (goal === "Heart Health") {
      recommendations.push("Include foods rich in omega-3 fatty acids and fiber for cardiovascular health");
      
      if (hasFruit) {
        recommendations.push("Fruits like these contain antioxidants that support heart health");
      }
    } else if (goal === "Diabetes Management") {
      recommendations.push("Monitor carbohydrate intake and choose foods with a lower glycemic index");
      
      if (highSugar) {
        recommendations.push("Be cautious with fruit sugar intake - pair with protein to moderate blood glucose impact");
      }
      
      if (highFiber) {
        recommendations.push("Fiber helps moderate blood sugar response, beneficial for diabetes management");
      }
    } else if (goal === "Muscle Gain") {
      recommendations.push("Ensure adequate protein intake throughout the day for muscle recovery and growth");
      
      if (hasFruit) {
        recommendations.push("Consume fruit around workouts to provide quick energy and recovery support");
      }
    }
    
    // Ensure we return a set of unique recommendations
    const uniqueRecommendations = Array.from(new Set(recommendations));
    return uniqueRecommendations.slice(0, 6); // Limit to 6 recommendations to avoid overwhelming
  };

  const handleUpload = async (file: File, goal: string) => {
    // Validate the file
    if (!file) {
      console.error("No file provided to handleUpload");
      setError("Please select an image to analyze");
      return;
    }

    // Double check the file is an image
    if (!file.type.startsWith('image/')) {
      console.error("File is not an image:", file.type);
      setError("Please select a valid image file (JPG, PNG, etc.)");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    // Create a local URL for the image
    const localImageUrl = URL.createObjectURL(file);
    setImageUrl(localImageUrl);

    try {
      // For demo purposes, we'll use mock data with a delay to simulate analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
        setHealthGoal(goal);
        setAnalysisComplete(true); // Set analysis as complete
      }, 2000);
    } catch (err: any) {
      console.error("Error analyzing meal:", err);
      setError(err.message || "Failed to analyze meal");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 py-6 md:py-10 relative z-10">
      {/* Header Section with Enhanced Description */}
      <section className="flex flex-col items-center justify-center text-center py-6 md:py-10 mb-4">
        <h1 className="text-4xl md:text-6xl font-bold text-cyan-accent mb-4">
          Snap2Health
        </h1>
        <p className="text-xl text-blue-100 mb-3">
          AI-Powered Nutrition Analysis
        </p>
        <div className="max-w-4xl text-center">
          <p className="text-lg text-blue-100/80 mb-4">
            Transform your eating habits with instant nutritional insights. Just snap a photo of your meal and get personalized recommendations based on your health goals.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="px-3 py-1 bg-darkBlue-accent/30 rounded-full text-sm text-blue-100/90">AI-Powered Analysis</span>
            <span className="px-3 py-1 bg-darkBlue-accent/30 rounded-full text-sm text-blue-100/90">Personalized Insights</span>
            <span className="px-3 py-1 bg-darkBlue-accent/30 rounded-full text-sm text-blue-100/90">Track Your Progress</span>
            <span className="px-3 py-1 bg-darkBlue-accent/30 rounded-full text-sm text-blue-100/90">Nutrition Education</span>
          </div>
        </div>
      </section>

      {!showResults ? (
        <div className="flex flex-col gap-8 items-stretch">
          {/* Upload Section with Embedded Goal */}
          <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-6 md:p-8 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center justify-center">
              {!isAnalyzing && !analysisComplete && (
                <div className="mb-6 relative">
                  <div className="relative w-24 h-24 mb-4 mx-auto">
                    <Image 
                      src="/camera-icon.svg" 
                      alt="Camera icon"
                      width={96}
                      height={96}
                      className="object-contain invert opacity-70"
                    />
                  </div>
                  <p className="text-center text-lg text-blue-100 mb-2">
                    Click to upload or take a photo
                  </p>
                </div>
              )}
              
              {analysisComplete && (
                <div className="mb-6 text-center">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                  <h2 className="text-2xl font-bold text-cyan-accent mt-4">Analysis Complete!</h2>
                  <p className="text-lg text-blue-100 mt-2">Preparing your personalized nutrition insights...</p>
                </div>
              )}
              
              <FoodUpload onUpload={handleUpload} isLoading={isAnalyzing} />
              
              {isMobile && (
                <div className="mt-6 p-4 bg-darkBlue-accent/20 border border-darkBlue-accent/30 text-blue-100 rounded-lg text-sm">
                  <p className="flex items-center">
                    <svg 
                      className="w-5 h-5 mr-2 flex-shrink-0 text-cyan-accent" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {isIOS 
                      ? "For best results, allow camera access when prompted."
                      : "Use your device's camera for the best experience."
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-5 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="bg-cyan-accent/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cyan-accent">Detailed Nutrition Breakdown</h3>
              </div>
              <p className="text-blue-100/80 text-sm">Get comprehensive analysis of macros, vitamins, and minerals in your meals.</p>
            </div>
            
            <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-5 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="bg-cyan-accent/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cyan-accent">Personalized Insights</h3>
              </div>
              <p className="text-blue-100/80 text-sm">Receive customized recommendations based on your specific health goals.</p>
            </div>
            
            <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-5 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="bg-cyan-accent/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cyan-accent">Instant Results</h3>
              </div>
              <p className="text-blue-100/80 text-sm">Get real-time feedback on your meal with our advanced AI analysis engine.</p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-6 md:p-8 rounded-2xl shadow-lg transition-opacity duration-500 ease-in-out ${
            resultsFadeIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Image & Health Goal */}
            <div className="lg:w-1/3 space-y-6">
              {/* Food Image */}
              <div>
                <h3 className="text-xl font-bold text-cyan-accent mb-4">Your Meal</h3>
                {imageUrl && (
                  <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg border border-darkBlue-accent/30">
                    <Image 
                      src={imageUrl} 
                      alt="Uploaded food" 
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                {mealCaption && (
                  <p className="text-white mt-2 text-center font-medium">
                    {mealCaption.includes('orange') ? 'Oranges' : mealCaption.split(' - ')[0].split('with')[0].trim()}
                  </p>
                )}
              </div>
              
              {/* Health Goal Card - Made more prominent with darker text */}
              <div className="bg-darkBlue-accent/30 border-2 border-cyan-accent/50 rounded-lg p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-cyan-accent">Your Health Goal</h3>
                  <div className="bg-cyan-accent/20 rounded-full p-1">
                    <svg 
                      className="w-5 h-5 text-cyan-accent" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-white font-semibold mb-3 text-lg">{healthGoal || 'General Wellness'}</p>
                <div className="text-sm text-white/90">
                  Analysis customized based on your specific health objective
                </div>
              </div>
              
              {/* Back Button */}
              <button 
                onClick={() => {
                  setImageUrl(null);
                  setShowResults(false);
                }}
                className="w-full py-3 border border-darkBlue-accent/40 bg-darkBlue-accent/20 text-cyan-accent rounded-lg hover:bg-darkBlue-accent/40 transition"
              >
                Upload a different image
              </button>
            </div>
            
            {/* Right Column - Analysis Results with Story Flow */}
            <div className="lg:w-2/3">
              <h2 className="text-2xl font-bold text-cyan-accent mb-4">Nutritional Analysis</h2>
              
              <div className="space-y-6">
                {/* Calories and Goal Overview */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center bg-darkBlue-accent/30 border border-darkBlue-accent/40 text-white px-6 py-3 rounded-xl">
                    <span className="text-3xl font-bold text-cyan-accent mr-2">{nutritionData.calories}</span>
                    <span className="text-white">calories</span>
                  </div>
                  
                  <div className="bg-cyan-accent/20 border-2 border-cyan-accent/50 rounded-xl px-6 py-3 flex items-center">
                    <div>
                      <span className="text-sm text-white/90">Health Goal:</span>
                      <p className="text-white font-semibold text-lg">{healthGoal || 'General Wellness'}</p>
                    </div>
                    <svg 
                      className="w-6 h-6 text-cyan-accent ml-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
                
                {/* Macro Distribution - First part of the story */}
                <div className="bg-darkBlue-accent/20 border border-darkBlue-accent/40 rounded-lg p-5 shadow-md">
                  <h3 className="text-xl font-bold text-cyan-accent mb-4">Nutritional Analysis</h3>
                  <NutritionAnalysis 
                    data={{
                      ...nutritionData, 
                      goal: healthGoal,
                      caption: mealCaption
                    }} 
                    showType="all" 
                    withUserProfile={isAuthenticated}
                  />
                </div>
                
                {/* Recommendations Section - Completing the story */}
                <div className="bg-darkBlue-accent/30 border-l-4 border-cyan-accent rounded-lg p-5 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-cyan-accent">Personalized Recommendations</h3>
                    {userProfile && (
                      <div className="bg-cyan-accent/20 px-3 py-1 rounded-full text-sm text-cyan-accent">
                        Personalized
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-5">
                    <p className="text-white">
                      Based on your <span className="font-semibold">{healthGoal || 'General Wellness'}</span> goal
                      {userProfile && (
                        <>
                          {userProfile.age && (
                            <span className="inline-flex items-center mx-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cyan-accent" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              age {userProfile.age}
                            </span>
                          )}
                          
                          {userProfile.gender && (
                            <span className="inline-flex items-center mx-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cyan-accent" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.349-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              {userProfile.gender.toLowerCase()}
                            </span>
                          )}
                          
                          {userProfile.height && userProfile.weight && (
                            <span className="inline-flex items-center mx-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cyan-accent" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582-1.599-.8a1 1 0 00-.894 1.79l1.233.616-1.738 5.42a1 1 0 00.285 1.05A3.989 3.989 0 005 15a3.989 3.989 0 002.667-1.019 1 1 0 00.285-1.05l-1.715-5.349L9 6.477V16H7a1 1 0 000 2h6a1 1 0 100-2h-2V6.477l2.763 1.105-1.715 5.349a1 1 0 00.285 1.05A3.989 3.989 0 0015 15a3.989 3.989 0 002.667-1.019 1 1 0 00.285-1.05l-1.738-5.42 1.233-.616a1 1 0 00-.894-1.79l-1.599.8L11 4.323V3a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              body profile
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <HealthInsights
                        suggestions={nutritionData.recommendations || mockSuggestions}
                      />
                    </div>
                    
                    {(nutritionData.concerns || mockConcerns).length > 0 && (
                      <div className="mt-4 border-t border-darkBlue-accent/30 pt-4">
                        <h4 className="text-white mb-2 font-medium">Areas to Consider:</h4>
                        <HealthInsights
                          concerns={nutritionData.concerns?.map((c: any) => c.concern || c.title) || mockConcerns}
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-darkBlue-accent/30">
                      <div className="flex items-center text-xs text-cyan-accent/80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Complete your health profile for more personalized recommendations</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-darkBlue-secondary/80 border border-darkBlue-accent/30 rounded-lg text-sm text-white/80">
                  <p>This analysis is based on advanced image recognition technology and nutritional databases. For personalized dietary advice, please consult with a healthcare professional.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 