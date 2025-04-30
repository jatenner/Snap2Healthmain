'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatMealTime } from '@/utils/formatMealTime';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import UserProfileSummary from '@/components/UserProfileSummary';

// Mock meal history data
const mockMealHistory = [
  {
    id: '1',
    mealName: 'Fresh Oranges',
    imageUrl: '/uploads/35e9e3fa-dce0-4b85-a22b-04f3a95229e2-oranges.jpeg',
    calories: 250,
    protein: 5,
    carbs: 60,
    createdAt: new Date().toISOString()
  }
];

export default function HistoryPage() {
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // This would be replaced with an actual API call in production
    // Example: fetch('/api/meal-history').then(res => res.json())...
    const loadHistory = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setMealHistory(mockMealHistory);
      } catch (error) {
        console.error('Error loading meal history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Meal History</h1>

      {/* Show profile summary for personalized context if user is authenticated */}
      {isAuthenticated && user?.user_metadata && (
        <div className="mb-8">
          <UserProfileSummary compact />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : mealHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No meals analyzed yet</h3>
          <p className="text-gray-500 mb-6">Start by analyzing your first meal</p>
          <Button onClick={() => router.push('/')}>Analyze a Meal</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {mealHistory.map((meal) => (
            <Card key={meal.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/4 relative h-48 md:h-auto">
                  <Image
                    src={meal.imageUrl}
                    alt={meal.mealName}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <CardContent className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{meal.mealName}</h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatMealTime(meal.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 my-4">
                    <div className="bg-green-50 p-3 rounded-md text-center">
                      <p className="text-lg font-semibold">{meal.calories}</p>
                      <p className="text-xs text-gray-500">Calories</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md text-center">
                      <p className="text-lg font-semibold">{meal.protein}g</p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-md text-center">
                      <p className="text-lg font-semibold">{meal.carbs}g</p>
                      <p className="text-xs text-gray-500">Carbs</p>
                    </div>
                  </div>
                  
                  {/* Add personalized context if user has profile data */}
                  {isAuthenticated && user?.user_metadata?.height && user?.user_metadata?.weight && (
                    <div className="mt-2 mb-3 text-xs text-gray-500 bg-blue-50 p-2 rounded-md">
                      {user?.user_metadata?.defaultGoal && (
                        <span className="font-medium">Goal: {user.user_metadata.defaultGoal}</span>
                      )}
                      <div className="text-gray-600 text-sm">
                        {meal.calories} calories
                        {calculateDailyCalories(user) && (
                          <span className="ml-2">
                            {Math.round((meal.calories / (calculateDailyCalories(user) || 1)) * 100)}% of daily calories
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Link href={`/meal-analysis?id=${meal.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to calculate daily calories based on user profile
function calculateDailyCalories(user: any) {
  if (!user?.user_metadata) return null;
  
  const { height, weight, age, gender } = user.user_metadata;
  
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
  
  // Moderate activity level (factor of 1.55)
  return Math.round(bmr * 1.55);
} 