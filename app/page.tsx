'use client';

import Link from 'next/link';
import { useAuth } from './components/client/ClientAuthProvider';

export default function Home() {
  const { isAuthenticated } = useAuth();

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
            {/* Instant Food Analysis Card */}
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Instant Food Analysis</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Take a photo of your meal and get detailed nutritional information within seconds.
              </p>
              <ul className="text-gray-300 mb-8 space-y-2">
                <li>• Accurate calorie count</li>
                <li>• Macronutrient breakdown</li>
                <li>• Vitamin and mineral content</li>
                <li>• Health insights and recommendations</li>
              </ul>
              <Link 
                href="/upload" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Analyze Your Meal
                    </Link>
            </div>

            {/* Personalized Nutrition Card */}
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Personalized Nutrition</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Get advice tailored to your health goals, dietary preferences, and personal metrics.
              </p>
              <ul className="text-gray-300 mb-8 space-y-2">
                <li>• Custom meal recommendations</li>
                <li>• Track progress toward your goals</li>
                <li>• Identify nutritional gaps</li>
                <li>• Build healthier eating habits</li>
              </ul>
              <Link 
                href="/profile" 
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