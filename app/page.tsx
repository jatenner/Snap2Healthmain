'use client';

import Link from 'next/link';
import { useAuth } from './components/client/ClientAuthProvider';
import HomeWelcome from './components/HomeWelcome';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
          Snap2Health
        </h1>
        <h2 className="text-xl md:text-2xl text-blue-400 text-center mb-6">
          AI-Powered Nutrition Analysis from Your Food Photos
        </h2>
        
        <HomeWelcome />

        <div className="bg-gray-800 rounded-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Understand Your Meals at a Glance
              </h3>
              <p className="text-gray-300 mb-6">
                Simply upload a photo of your meal and our AI will analyze its nutritional content, giving you detailed insights about calories, macronutrients, and more.
              </p>
              
              {!isLoading && (
                isAuthenticated ? (
                  <Link href="/upload" className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors">
                    Upload a Meal
                  </Link>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/30 border border-blue-800 rounded-lg text-blue-200 mb-4">
                      <p>You need to sign in to use Snap2Health's features and save your meal history.</p>
                    </div>
                    <Link href="/login" className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors">
                      Sign In to Continue
                    </Link>
                  </div>
                )
              )}
            </div>
            <div className="bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-400 text-center">Food Image Placeholder</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Instant Analysis</h3>
            <p className="text-gray-300">
              Get detailed nutritional information about your meals in seconds, no manual logging required.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Personalized Insights</h3>
            <p className="text-gray-300">
              Receive feedback tailored to your dietary goals, restrictions, and nutritional needs.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Track Progress</h3>
            <p className="text-gray-300">
              Monitor your eating habits over time with a comprehensive meal history and analysis trends.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-6">
            Join thousands of users improving their nutrition awareness with Snap2Health
          </p>
          
          {!isLoading && !isAuthenticated && (
            <Link href="/login" className="inline-block bg-green-600 text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-green-700 transition-colors">
              Get Started Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 