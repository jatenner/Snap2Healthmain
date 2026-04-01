'use client';

import Link from 'next/link';
import { Camera, BarChart3, Lightbulb, History, Target, Sparkles, Plus, MessageCircle, User } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';
import NutritionDashboard from './components/NutritionDashboard';
import ClientOnly from './components/ClientOnly';
import { useEffect, useState } from 'react';
import { createClient } from './lib/supabase/client';
import Image from 'next/image';

interface RecentMeal {
  id: string;
  meal_name: string;
  image_url: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  analysis: any;
}

function RecentMealsSection({ userId }: { userId: string }) {
  const [meals, setMeals] = useState<RecentMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentMeals() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('meals')
          .select('id, meal_name, image_url, calories, protein, carbs, fat, created_at, analysis')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setMeals(data);
        }
      } catch (e) {
        // Silently fail -- dashboard still works without recent meals
      } finally {
        setLoading(false);
      }
    }
    fetchRecentMeals();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">No meals analyzed yet. Upload your first meal to get started!</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Analyze Your First Meal
        </Link>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {meals.map(meal => (
        <Link
          key={meal.id}
          href={`/analysis/${meal.id}`}
          className="bg-slate-800 hover:bg-slate-750 rounded-xl overflow-hidden transition-all duration-200 hover:ring-1 hover:ring-blue-500/50 group"
        >
          {/* Meal image */}
          <div className="relative h-32 bg-slate-700">
            {meal.image_url && !meal.image_url.startsWith('data:') ? (
              <Image
                src={meal.image_url}
                alt={meal.meal_name || 'Meal'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <span className="absolute top-2 right-2 bg-black/60 text-gray-300 text-xs px-2 py-1 rounded">
              {formatTime(meal.created_at)}
            </span>
          </div>
          {/* Meal info */}
          <div className="p-4">
            <h4 className="text-white font-medium truncate mb-2">
              {meal.meal_name || 'Analyzed Meal'}
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-orange-400">{meal.calories || 0}</div>
                <div className="text-xs text-gray-500">cal</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-400">{Math.round(meal.protein || 0)}g</div>
                <div className="text-xs text-gray-500">protein</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-400">{Math.round(meal.carbs || 0)}g</div>
                <div className="text-xs text-gray-500">carbs</div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AuthenticatedHome({ userId }: { userId: string }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Track your nutrition journey</p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Analyze Meal
          </Link>
        </div>

        {/* Recent Meals */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Recent Meals
            </h2>
            <Link href="/meal-history" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </Link>
          </div>
          <RecentMealsSection userId={userId} />
        </section>

        {/* Nutrition Dashboard */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Nutrition Overview
          </h2>
          <NutritionDashboard />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gray-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/upload" className="bg-slate-800 hover:bg-slate-750 rounded-xl p-5 text-center transition-all hover:ring-1 hover:ring-blue-500/50">
              <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <span className="text-sm text-gray-300">Analyze Meal</span>
            </Link>
            <Link href="/meal-history" className="bg-slate-800 hover:bg-slate-750 rounded-xl p-5 text-center transition-all hover:ring-1 hover:ring-blue-500/50">
              <History className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <span className="text-sm text-gray-300">Meal History</span>
            </Link>
            <Link href="/profile" className="bg-slate-800 hover:bg-slate-750 rounded-xl p-5 text-center transition-all hover:ring-1 hover:ring-blue-500/50">
              <User className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <span className="text-sm text-gray-300">Profile</span>
            </Link>
            <button
              onClick={() => {
                // Trigger the global chat widget if it exists
                const chatBtn = document.querySelector('[data-chat-toggle]') as HTMLButtonElement;
                if (chatBtn) chatBtn.click();
              }}
              className="bg-slate-800 hover:bg-slate-750 rounded-xl p-5 text-center transition-all hover:ring-1 hover:ring-blue-500/50"
            >
              <MessageCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <span className="text-sm text-gray-300">AI Coach</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MarketingHome() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your AI-Powered Nutrition Assistant
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload photos of your meals and get instant nutritional analysis powered by artificial intelligence.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go to Upload
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Instant Food Analysis</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Take a photo of your meal and get detailed nutritional information within seconds.
              </p>
              <ul className="text-gray-300 mb-8 space-y-2">
                <li>Accurate calorie count</li>
                <li>Macronutrient breakdown</li>
                <li>Vitamin and mineral content</li>
                <li>Health insights and recommendations</li>
              </ul>
              <Link
                href="/upload"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Analyze Your Meal
              </Link>
            </div>

            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Personalized Nutrition</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Get advice tailored to your health goals, dietary preferences, and personal metrics.
              </p>
              <ul className="text-gray-300 mb-8 space-y-2">
                <li>Custom meal recommendations</li>
                <li>Track progress toward your goals</li>
                <li>Identify nutritional gaps</li>
                <li>Build healthier eating habits</li>
              </ul>
              <Link
                href="/meal-history"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                View Your History
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-white">Upload Photo</h3>
              <p className="text-gray-400">Take a photo of your meal or upload from your gallery</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-white">AI Analysis</h3>
              <p className="text-gray-400">Our AI analyzes your meal against your personal health profile</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-white">Get Insights</h3>
              <p className="text-gray-400">Receive detailed nutrition data and personalized recommendations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-opacity-50">
          Loading...
        </div>
      </div>
    }>
      {isAuthenticated && user?.id ? (
        <AuthenticatedHome userId={user.id} />
      ) : (
        <MarketingHome />
      )}
    </ClientOnly>
  );
}
