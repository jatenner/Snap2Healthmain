'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/src/lib/supabase-singleton';
import StatsCard from '@/src/components/StatsCard';
import MealUploader from '@/src/components/MealUploader';
import { Loader } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mealHistory, setMealHistory] = useState([]);
  const [stats, setStats] = useState({
    totalMeals: 0,
    avgCalories: 0,
    avgProtein: 0,
    bestMeal: null
  });

  const router = useRouter();
  const supabase = getSupabaseClient();

  async function fetchMealHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setMealHistory(data || []);

      if (data && data.length > 0) {
        // Calculate stats
        const totalMeals = data.length;
        
        // Calculate average calories
        const totalCalories = data.reduce((sum, meal) => {
          let calories = 0;
          if (meal.analysis) {
            try {
              const analysis = typeof meal.analysis === 'string' 
                ? JSON.parse(meal.analysis) 
                : meal.analysis;
              calories = analysis.calories || 0;
            } catch (err) {
              console.error('Error parsing meal analysis:', err);
            }
          }
          return sum + calories;
        }, 0);

        // Calculate average protein
        const totalProtein = data.reduce((sum, meal) => {
          let protein = 0;
          if (meal.analysis) {
            try {
              const analysis = typeof meal.analysis === 'string' 
                ? JSON.parse(meal.analysis) 
                : meal.analysis;
              protein = analysis.protein || 0;
            } catch (err) {
              console.error('Error parsing meal protein:', err);
            }
          }
          return sum + protein;
        }, 0);

        // Find best meal (highest protein to calorie ratio)
        let bestMeal = null;
        let bestRatio = 0;

        data.forEach(meal => {
          try {
            if (meal.analysis) {
              const analysis = typeof meal.analysis === 'string' 
                ? JSON.parse(meal.analysis) 
                : meal.analysis;
              const calories = analysis.calories || 0;
              const protein = analysis.protein || 0;
              
              if (calories > 0) {
                const ratio = protein / calories;
                if (ratio > bestRatio) {
                  bestRatio = ratio;
                  bestMeal = meal;
                }
              }
            }
          } catch (err) {
            console.error('Error calculating meal ratios:', err);
          }
        });

        setStats({
          totalMeals,
          avgCalories: totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0,
          avgProtein: totalMeals > 0 ? Math.round(totalProtein / totalMeals) : 0,
          bestMeal
        });
      }
    } catch (err) {
      console.error('Error fetching meal history:', err);
    }
  }

  useEffect(() => {
    (async function() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        await fetchMealHistory(session.user.id);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to Your Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Total Meals" 
          value={stats.totalMeals} 
          unit="" 
          icon="📊"
        />
        <StatsCard 
          title="Avg. Calories" 
          value={stats.avgCalories} 
          unit=" kcal" 
          icon="🔥"
        />
        <StatsCard 
          title="Avg. Protein" 
          value={stats.avgProtein} 
          unit=" g" 
          icon="💪"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload New Meal</h2>
          <MealUploader />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Meals</h2>
            <Link href="/history" className="text-blue-500 hover:text-blue-700 text-sm">
              View All →
            </Link>
          </div>
          
          {mealHistory.length > 0 ? (
            <div className="space-y-4">
              {mealHistory.map(meal => (
                <div key={meal.id} className="border rounded-md p-4 flex items-center">
                  {meal.image_url && (
                    <div className="h-16 w-16 rounded-md overflow-hidden mr-4">
                      <img 
                        src={meal.image_url} 
                        alt={meal.caption || "Meal"} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{meal.caption || "Meal analysis"}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(meal.created_at).toLocaleDateString()}
                    </p>
                    <Link 
                      href={`/meal/${meal.id}`} 
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No meal history found.</p>
              <p className="text-sm mt-2">Upload your first meal to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 