'use client';

import Link from 'next/link';
import { useAuth } from './context/auth';
import Logo from './components/Logo';
import { Upload, History, User, Sparkles, Target, TrendingUp } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Your Meals into 
            <span className="text-blue-400 block mt-2">Health Insights</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload any food photo and get instant AI-powered nutrition analysis, 
            personalized recommendations, and track your health goals.
          </p>
          
          {user ? (
            <Link 
              href="/upload"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <Upload className="w-5 h-5 mr-2" />
              Start Analyzing Your Meals
            </Link>
          ) : (
            <Link 
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <User className="w-5 h-5 mr-2" />
              Get Started - Sign In
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Analysis</h3>
            <p className="text-gray-300">
              Advanced computer vision and nutrition AI analyze your meals instantly, 
              identifying ingredients and calculating detailed nutritional information.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Personalized Goals</h3>
            <p className="text-gray-300">
              Set your health goals and get customized recommendations. Whether it's weight loss, 
              muscle gain, or general wellness, we adapt to your needs.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Track Progress</h3>
            <p className="text-gray-300">
              Monitor your nutrition over time with detailed meal history, 
              progress tracking, and insights to help you reach your goals.
            </p>
          </div>
        </div>

        {/* Quick Actions for Authenticated Users */}
        {user && (
          <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Welcome back! What would you like to do?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Link 
                href="/upload"
                className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-center transition-colors group"
              >
                <Upload className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Upload & Analyze</h3>
                <p className="text-blue-100 text-sm">Take or upload a photo of your meal</p>
              </Link>
              
              <Link 
                href="/meal-history"
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-6 text-center transition-colors group"
              >
                <History className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">View History</h3>
                <p className="text-gray-300 text-sm">See your previous meal analyses</p>
              </Link>
              
              <Link 
                href="/profile"
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-6 text-center transition-colors group"
              >
                <User className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Update Profile</h3>
                <p className="text-gray-300 text-sm">Manage your goals and preferences</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 