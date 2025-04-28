import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AnalysisSection } from '@/components/AnalysisSection';
import NutrientGroup from '@/components/NutrientGroup';
import MacroDistributionChart from '@/components/MacroDistributionChart';
import { retrieveFromSession } from '@/lib/session';

// Helper function to safely process the analysis data
const getSafeAnalysisData = (data: any) => {
  if (!data || !data.analysis) {
    return {
      calories: 0,
      macronutrients: [],
      micronutrients: [],
      benefits: [],
      concerns: [],
      suggestions: []
    };
  }

  return {
    calories: data.analysis.calories || 0,
    macronutrients: data.analysis.macronutrients || [],
    micronutrients: data.analysis.micronutrients || [],
    benefits: data.analysis.benefits || [],
    concerns: data.analysis.concerns || [],
    suggestions: data.analysis.suggestions || []
  };
};

// Mock data for development
const mockMealData = {
  mealName: "Grilled Chicken Salad",
  goal: "Weight Loss",
  imageUrl: "https://placehold.co/600x400",
  analysis: {
    calories: 450,
    macronutrients: [
      { name: "Protein", amount: "35g" },
      { name: "Carbs", amount: "25g" },
      { name: "Fat", amount: "20g" }
    ],
    micronutrients: [
      { name: "Vitamin A", amount: "15%" },
      { name: "Vitamin C", amount: "45%" },
      { name: "Iron", amount: "10%" },
      { name: "Calcium", amount: "8%" }
    ],
    benefits: [
      "Good source of lean protein",
      "Rich in vitamins and minerals",
      "Low in refined carbohydrates"
    ],
    concerns: [
      "Could be higher in fiber",
      "Dressing may add hidden calories"
    ],
    suggestions: [
      "Add more vegetables for additional fiber",
      "Consider using olive oil based dressing",
      "Include some whole grains for sustained energy"
    ]
  }
};

// Add this function to try retrieving data from localStorage as a fallback
const getDataFromLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('mealData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export default async function MealAnalysisPage() {
  // Retrieve data from session
  let mealData = await retrieveFromSession('mealData');
  
  console.log("Session data retrieved:", !!mealData);
  
  // Use mock data in development if session data is not available
  if (!mealData && process.env.NODE_ENV === 'development') {
    console.log("Using mock data in development environment");
    mealData = mockMealData;
  }
  
  // Handle case where we need to attempt localStorage fallback
  const needsClientFallback = !mealData;
  
  if (!mealData) {
    // If no data is found, redirect to the home page with error
    console.error('No meal data found in the session');
    return (
      <ClientFallback />
    );
  }
  
  // Process the data safely
  const {
    calories,
    macronutrients,
    micronutrients,
    benefits,
    concerns,
    suggestions
  } = getSafeAnalysisData(mealData);
  
  // Calculate total macros for the chart
  const totalMacros = macronutrients.reduce((acc: any, macro: any) => {
    const value = typeof macro.amount === 'string' 
      ? parseFloat(macro.amount.replace(/[^\d.-]/g, '')) 
      : (macro.amount || 0);
    
    if (!isNaN(value)) {
      acc[macro.name.toLowerCase()] = value;
    }
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Meal Analysis</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Analyze New Meal
          </Link>
        </div>
        
        {/* Meal Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="md:w-1/3">
              <div className="relative aspect-square w-full overflow-hidden rounded-md">
                {mealData.imageUrl && (
                  <Image
                    src={mealData.imageUrl}
                    alt={mealData.mealName || "Meal photo"}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-2">
                {mealData.mealName || "Your Meal"}
              </h2>
              
              {mealData.goal && (
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Your Goal:</span> {mealData.goal}
                </p>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Nutritional Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {calories} kcal
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {macronutrients.slice(0, 3).map((macro: any, index: number) => (
                      <div key={index}>
                        <div className="text-gray-600 text-sm">{macro.name}</div>
                        <div className="font-semibold">{macro.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Macro Distribution Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Macronutrient Distribution</h3>
                <div className="h-40">
                  <MacroDistributionChart
                    protein={totalMacros.protein}
                    carbs={totalMacros.carbs}
                    fat={totalMacros.fat}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Analysis */}
        <div className="space-y-8">
          {/* Macronutrients */}
          <NutrientGroup
            title="Macronutrients"
            nutrients={macronutrients}
          />
          
          {/* Micronutrients */}
          <NutrientGroup
            title="Micronutrients"
            nutrients={micronutrients}
          />
          
          {/* Benefits, Concerns, Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalysisSection
              title="Benefits"
              items={benefits}
              icon="✅"
              className="bg-green-50"
            />
            
            <AnalysisSection
              title="Concerns"
              items={concerns}
              icon="⚠️"
              className="bg-amber-50"
            />
            
            <AnalysisSection
              title="Suggestions"
              items={suggestions}
              icon="💡"
              className="bg-blue-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Client component to try localStorage fallback
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function ClientFallback() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    try {
      const localData = localStorage.getItem('mealData');
      
      if (localData) {
        console.log("Found data in localStorage, using it for analysis");
        // We found data in localStorage!
        // Store it in the session from client side and reload
        fetch('/api/session/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            key: 'mealData', 
            value: JSON.parse(localData) 
          }),
        })
        .then(response => {
          if (response.ok) {
            window.location.reload();
          } else {
            router.push('/?error=session-storage-failed');
          }
        })
        .catch(error => {
          console.error('Error storing session data:', error);
          router.push('/');
        });
      } else {
        console.log("No meal data found in localStorage");
        setIsChecking(false);
        router.push('/');
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setIsChecking(false);
      router.push('/');
    }
  }, [router]);
  
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Looking for your meal data...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Session Data Not Found</h1>
      <p className="text-gray-600 mb-6">We couldn't find your meal analysis data.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
} 