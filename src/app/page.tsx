<<<<<<< HEAD
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return <div></div>;
=======
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 mb-16">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Understand Your Food with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Upload a food photo or describe your meal to get instant nutrition analysis and personalized health insights powered by GPT-4o.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/upload"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 text-center"
              >
                Analyze Your Food
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-md border border-indigo-600 hover:bg-indigo-50 text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-100 z-0" />
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="text-6xl mb-2">🥗</div>
                <p className="text-lg font-medium text-indigo-700">Snap a photo of your meal</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-indigo-600 text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Snap or Describe</h3>
              <p className="text-gray-600">
                Take a photo of your meal or simply describe what you're eating.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-indigo-600 text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our GPT-4o powered AI identifies ingredients and calculates nutrition.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-indigo-600 text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2">Personal Insights</h3>
              <p className="text-gray-600">
                Get personalized nutrition insights based on your health goals.
              </p>
            </div>
          </div>
        </section>

        {/* Health Goals Section */}
        <section className="mb-16 bg-gray-50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-6">Tailored to Your Health Goals</h2>
          <p className="text-xl text-center text-gray-600 mb-10 max-w-3xl mx-auto">
            Choose your health goal and receive personalized nutrition insights and recommendations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'General Wellness'].map((goal) => (
              <div key={goal} className="bg-white p-5 rounded-md shadow-sm flex items-center">
                <div className="mr-4 text-2xl">
                  {goal === 'Weight Loss' && '⚖️'}
                  {goal === 'Muscle Gain' && '💪'}
                  {goal === 'Heart Health' && '❤️'}
                  {goal === 'Diabetes Management' && '🩸'}
                  {goal === 'General Wellness' && '🌱'}
                </div>
                <div>
                  <h3 className="font-medium">{goal}</h3>
                  <p className="text-sm text-gray-500">Personalized analysis</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to understand your food better?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get started for free and discover the nutritional profile of your meals.
          </p>
          <Link
            href="/upload"
            className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 inline-block"
          >
            Try Snap2Health Now
          </Link>
        </section>
      </div>
    </div>
  );
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
} 