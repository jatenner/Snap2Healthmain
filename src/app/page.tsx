'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FoodUpload from '@/components/FoodUpload';
import NutritionAnalysis from '@/components/NutritionAnalysis';
import { isMobileDevice, isIOSDevice } from '@/utils/deviceDetection';

// Update the mock data structure to match the NutritionData interface
const mockNutritionData = {
  calories: 450,
  caption: "Balanced meal with whole grains and fresh ingredients",
  goal: "General Wellness",
  macroNutrients: {
    protein: { name: "Protein", amount: 20, unit: "g", percentDailyValue: 40, benefits: "Essential for muscle repair and growth" },
    carbohydrates: { name: "Carbohydrates", amount: 60, unit: "g", percentDailyValue: 20, benefits: "Primary source of energy" },
    fat: { name: "Fat", amount: 15, unit: "g", percentDailyValue: 23, benefits: "Important for hormone production and nutrient absorption" },
    fiber: { name: "Fiber", amount: 8, unit: "g", percentDailyValue: 28, benefits: "Supports digestive health and helps manage blood sugar" },
    sugar: { name: "Sugar", amount: 12, unit: "g", percentDailyValue: 24, benefits: "Natural sugars from fruits provide quick energy" },
    sodium: { name: "Sodium", amount: 400, unit: "mg", percentDailyValue: 17, benefits: "Essential for fluid balance and nerve/muscle function" },
  },
  microNutrients: {
    "Vitamin A": { name: "Vitamin A", amount: 750, unit: "IU", percentDailyValue: 15, benefits: "Supports vision and immune function" },
    "Vitamin C": { name: "Vitamin C", amount: 15, unit: "mg", percentDailyValue: 25, benefits: "Antioxidant that helps with iron absorption" },
    "Vitamin D": { name: "Vitamin D", amount: 2, unit: "μg", percentDailyValue: 10, benefits: "Promotes calcium absorption and bone health" },
    "Calcium": { name: "Calcium", amount: 120, unit: "mg", percentDailyValue: 12, benefits: "Essential for bone strength and muscle function" },
    "Iron": { name: "Iron", amount: 1.4, unit: "mg", percentDailyValue: 8, benefits: "Helps transport oxygen throughout the body" }
  },
  expertAdvice: "This meal provides a good balance of macronutrients for your General Wellness goal. The moderate protein content supports muscle maintenance, while the carbohydrates provide sustainable energy. Consider adding more leafy greens to increase nutrient density."
};

const mockHealthInsights = [
  "Great source of protein and fiber",
  "Contains essential vitamins for immune support",
  "Moderate sodium level, within daily recommendations",
  "Good balance of macronutrients for sustained energy"
];

const mockConcerns = [
  "Contains moderate sugar content",
  "May not provide sufficient omega-3 fatty acids"
];

const mockSuggestions = [
  "Add a source of healthy fats like avocado or olive oil",
  "Include more leafy greens to boost vitamin K content",
  "Consider adding a whole grain to improve fiber content and satiety"
];

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Check device on component mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsIOS(isIOSDevice());
  }, []);
  
  // This function is just a mock for visual demo purposes
  // The actual FoodUpload component has its own file upload handling
  const handleMockUpload = (file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <main className="min-h-screen relative z-10">
      <div className="container mx-auto px-4 py-10">
        {/* Header Section */}
        <section className="flex flex-col items-center justify-center text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-bold text-cyan-accent mb-6">
            Snap2Health
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-12">
            Analyze Your Food
          </p>
          <p className="text-lg text-blue-100/80 max-w-2xl mb-16">
            Take a photo of your meal for nutritional analysis
          </p>

          {/* Main Upload Area */}
          <div className="w-full max-w-3xl mx-auto">
            {!showResults ? (
              <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-8 relative">
                    <div className="relative w-24 h-24 mb-4 mx-auto">
                      <Image 
                        src="/camera-icon.svg" 
                        alt="Camera icon"
                        fill
                        className="object-contain invert opacity-70"
                      />
                    </div>
                    <p className="text-center text-lg text-blue-100 mb-2">
                      Click to upload or take a photo
                    </p>
                  </div>
                  
                  {/* Original FoodUpload component doesn't have these props, this is just a mock-up for visuals */}
                  <div className="w-full max-w-md">
                    <div className="relative border-dashed border-2 border-darkBlue-accent/40 rounded-lg p-8 text-center cursor-pointer hover:bg-darkBlue-accent/10 transition">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMockUpload(file);
                        }}
                      />
                      <p className="text-blue-100">Drop image here or click to browse</p>
                    </div>
                  </div>
                  
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
            ) : (
              // Results section
              <div className="bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {imageUrl && (
                      <div className="relative h-64 w-full rounded-lg overflow-hidden">
                        <Image 
                          src={imageUrl} 
                          alt="Uploaded food" 
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setImageUrl(null);
                        setShowResults(false);
                      }}
                      className="mt-4 w-full py-2 px-4 border border-darkBlue-accent/40 bg-darkBlue-accent/20 text-cyan-accent rounded-lg hover:bg-darkBlue-accent/40 transition"
                    >
                      Upload a different image
                    </button>
                  </div>
                  
                  <div className="md:w-2/3">
                    <h2 className="text-2xl font-bold text-cyan-accent mb-4">Food Analysis Results</h2>
                    {/* Only show the NutritionAnalysis component, remove HealthInsights */}
                    <div className="text-blue-100">
                      <NutritionAnalysis data={mockNutritionData} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Health Goal Section */}
          <div className="mt-12 w-full max-w-xl">
            <h2 className="text-xl text-blue-100 mb-4">Health Goal</h2>
            <input
              type="text"
              placeholder="Enter your specific health goal"
              className="w-full p-4 bg-darkBlue-secondary/60 border border-darkBlue-accent/40 rounded-lg text-blue-100 placeholder-blue-100/50 focus:outline-none focus:ring-2 focus:ring-cyan-accent/50"
            />
            <button 
              className="mt-6 w-full py-4 bg-cyan-accent text-darkBlue font-semibold rounded-lg hover:bg-cyan-accent/90 transition"
            >
              Analyze Food
            </button>
          </div>
        </section>
      </div>
    </main>
  );
} 