'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FoodUpload from '@/components/FoodUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isMobileDevice, isIOSDevice } from '@/utils/deviceDetection';
import { useAuth } from '@/context/auth';
import { useRouter } from 'next/navigation';
import { UserStatusBanner } from '@/app/components/UserStatusBanner';
import { MealUploader } from '@/components/MealUploader';
import Link from 'next/link';

// Define type for analysis result
interface AnalysisResult {
  success: boolean;
  mealId: string;
  mealContents: {
    foods: Array<{ name: string, amount: string }>;
  };
  mealAnalysis: {
    mealName: string;
    calories: number;
    macronutrients: Array<{ name: string, amount: number, unit: string, percentDailyValue: number }>;
    micronutrients: Array<{ name: string, amount: number, unit: string, percentDailyValue: number }>;
    recoveryInsights: {
      proteinAdequacy: string;
      carbohydrateRefueling: string;
      inflammatoryProfile: string;
    };
    digestiveHealth?: {
      glycemicLoad: string;
      fiberContent: string;
      probioticContent: string;
    };
    allergensInfo?: string[];
    macroRatios?: {
      proteinPercentage: number;
      carbPercentage: number;
      fatPercentage: number;
    };
    benefits: string[];
    concerns: string[];
    suggestions: string[];
  };
}

export default function Home() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [healthGoal, setHealthGoal] = useState('General Wellness');
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const router = useRouter();
  
  // CRITICAL: Skip redirects and always show content
  // Comment out the auth redirect that was causing problems
  /*
  useEffect(() => {
    if (isInitialized && !user) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, isInitialized, router]);
  */

  // Check device on component mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsIOS(isIOSDevice());
    
    // Set default health goal from user profile if available
    if (user?.user_metadata?.defaultGoal) {
      setHealthGoal(user.user_metadata.defaultGoal);
    }
    
    // Check if profile is complete
    if (user?.user_metadata) {
      const hasProfileInfo = !!(
        user.user_metadata.height && 
        user.user_metadata.weight && 
        user.user_metadata.age && 
        user.user_metadata.gender
      );
      setProfileComplete(hasProfileInfo);
    }
  }, [user]);

  const handleUpload = async (file: File, goal: string) => {
    if (!file) {
      setError("Please select an image to analyze");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (JPG, PNG, etc.)");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);
    
    // Create a local URL for the image
    const localImageUrl = URL.createObjectURL(file);
    setImageUrl(localImageUrl);

    try {
      console.log("Starting image upload process");
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('goal', goal);
      
      // Debug auth cookies
      console.log("Auth cookies before upload:", {
        localAuth: document.cookie.includes('use-local-auth=true'),
        hasAuthUser: document.cookie.includes('local-auth-user')
      });
      
      // First upload the image
      console.log("Sending upload request");
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important: Include cookies for auth
      });
      
      console.log("Upload response status:", uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", uploadResponse.status, errorText);
        
        if (uploadResponse.status === 401) {
          throw new Error("Authentication required. Please try logging in again.");
        } else {
          throw new Error(`Upload failed: ${uploadResponse.statusText || 'Unknown error'}`);
        }
      }
      
      const uploadResult = await uploadResponse.json();
      console.log("Upload succeeded:", uploadResult.success);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
      
      // Now analyze the uploaded image
      console.log("Sending analysis request");
      const analyzeResponse = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: uploadResult.imageUrl,
          goal: goal
        }),
        credentials: 'include', // Important: Include cookies for auth
      });
      
      console.log("Analysis response status:", analyzeResponse.status);
      
      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error("Analysis failed:", analyzeResponse.status, errorText);
        
        if (analyzeResponse.status === 401) {
          throw new Error("Authentication required for analysis. Please try logging in again.");
        } else {
          throw new Error(`Analysis failed: ${analyzeResponse.statusText || 'Unknown error'}`);
        }
      }
      
      const analysisResult = await analyzeResponse.json();
      console.log("Analysis succeeded:", analysisResult.success);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Failed to analyze image');
      }
      
      // Successfully analyzed - store the analysis data
      setAnalysisData(analysisResult);
      setIsAnalyzing(false);
      setShowResults(true);
      setHealthGoal(goal);
      setAnalysisComplete(true);
      
    } catch (err: any) {
      console.error("Error analyzing meal:", err);
      setError(err.message || "Failed to analyze meal");
      setIsAnalyzing(false);
    }
  };

  // Always render the main content, bypassing authentication checks
  // This helps prevent getting stuck on loading screens
  return (
    <main className="min-h-screen">
      <UserStatusBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-blue-100 mb-2">
            Analyze Your Food
          </h1>
          <p className="text-center text-blue-200/80 mb-8">
            Upload a photo of your meal to get personalized nutrition insights
          </p>
          
          {!user && (
            <div className="text-center p-6 bg-darkBlue-secondary/60 backdrop-blur-sm border border-darkBlue-accent/40 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-2 text-white">Sign in to analyze meals</h3>
              <p className="text-blue-100/80 mb-6">Authentication is required to use this feature</p>
              <Link 
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                Sign In
              </Link>
            </div>
          )}
          
          <MealUploader />
        </div>
      </div>
    </main>
  );
} 