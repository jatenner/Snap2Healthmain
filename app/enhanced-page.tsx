'use client';

import Link from 'next/link';
import { Camera, BarChart3, Lightbulb, History, Target, Sparkles, Upload, TrendingUp, Award } from 'lucide-react';
import { useAuth } from './components/client/ClientAuthProvider';

export default function EnhancedHome() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-slate-900 via-blue-900/10 to-purple-900/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            New: Enhanced Analytics & Smart Recommendations
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI-Powered</span>
            <br />Nutrition Assistant
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Upload photos of your meals and get instant, personalized nutritional analysis powered by advanced AI. 
            Track your progress, discover patterns, and get smart recommendations tailored to your health goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Analyze Your Meal
            </Link>
            
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful Features for Better Health</h2>
            <p className="text-gray-400 text-lg">Everything you need to understand and improve your nutrition</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Smart Camera Analysis */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Smart Camera</h3>
              <p className="text-gray-300 mb-6">
                Mobile-optimized camera interface with real-time analysis, flash control, and instant nutrition insights.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Real-time food recognition</li>
                <li>• Professional camera controls</li>
                <li>• Instant analysis results</li>
              </ul>
              <Link 
                href="/upload" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Try Camera
              </Link>
            </div>

            {/* Nutrition Dashboard */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 hover:border-green-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Analytics Dashboard</h3>
              <p className="text-gray-300 mb-6">
                Comprehensive nutrition tracking with trends, goals, progress indicators, and weekly insights.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Daily nutrition goals</li>
                <li>• Weekly trend analysis</li>
                <li>• Macro breakdown charts</li>
              </ul>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Link>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-8 hover:border-purple-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Recommendations</h3>
              <p className="text-gray-300 mb-6">
                Personalized meal suggestions based on your eating patterns, nutrition gaps, and health goals.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Pattern-based suggestions</li>
                <li>• Nutrition gap analysis</li>
                <li>• Personalized meal ideas</li>
              </ul>
              <Link 
                href="/recommendations" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Suggestions
              </Link>
            </div>

            {/* Enhanced Meal History */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-8 hover:border-orange-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <History className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Enhanced History</h3>
              <p className="text-gray-300 mb-6">
                Advanced filtering, sorting, and search across all your meals with grid and list views.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Smart filtering options</li>
                <li>• Multiple view modes</li>
                <li>• Search by ingredients</li>
              </ul>
              <Link 
                href="/meal-history" 
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
              >
                <History className="w-4 h-4 mr-2" />
                Browse History
              </Link>
            </div>

            {/* Goal Tracking */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-8 hover:border-yellow-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Goal Tracking</h3>
              <p className="text-gray-300 mb-6">
                Set and track nutrition goals with visual progress indicators, achievements, and milestones.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Custom goal setting</li>
                <li>• Progress visualization</li>
                <li>• Achievement system</li>
              </ul>
              <Link 
                href="/profile" 
                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
              >
                <Target className="w-4 h-4 mr-2" />
                Set Goals
              </Link>
            </div>

            {/* Enhanced Analysis */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-8 hover:border-indigo-500/40 transition-all duration-300 group">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Deep Analysis</h3>
              <p className="text-gray-300 mb-6">
                Comprehensive nutritional analysis with health insights, meal optimization, and personalized advice.
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1">
                <li>• Detailed nutrition breakdown</li>
                <li>• Health score calculation</li>
                <li>• Optimization suggestions</li>
              </ul>
              <Link 
                href="/upload" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Meal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity for Authenticated Users */}
      {isAuthenticated && (
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h2>
                  <p className="text-gray-400">Here's your nutrition overview</p>
                </div>
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  View Full Dashboard
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Quick Analysis</h3>
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-gray-300 text-sm mb-4">Upload a new meal to get instant analysis</p>
                  <Link 
                    href="/upload"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Upload Now
                    <Camera className="w-3 h-3 ml-1" />
                  </Link>
                </div>
                
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Recent Meals</h3>
                    <History className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-gray-300 text-sm mb-4">View your complete meal history</p>
                  <Link 
                    href="/meal-history"
                    className="inline-flex items-center text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Browse History
                    <History className="w-3 h-3 ml-1" />
                  </Link>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Smart Tips</h3>
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-gray-300 text-sm mb-4">Get personalized recommendations</p>
                  <Link 
                    href="/recommendations"
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    View Suggestions
                    <Lightbulb className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Get started in just three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Upload or Capture</h3>
              <p className="text-gray-400">Take a photo with our smart camera or upload from your gallery</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
              <p className="text-gray-400">Our advanced AI analyzes your meal against your personal health profile</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get Insights</h3>
              <p className="text-gray-400">Receive detailed nutrition data, trends, and personalized recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Nutrition?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands who are already using AI to make smarter food choices and achieve their health goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/upload" 
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
              >
                <Camera className="w-5 h-5 mr-2" />
                Analyze Your First Meal
              </Link>
              
              {!isAuthenticated && (
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200"
                >
                  <Award className="w-5 h-5 mr-2" />
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 