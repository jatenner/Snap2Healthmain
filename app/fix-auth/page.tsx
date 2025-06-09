'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FixAuthPage() {
  const [instructions, setInstructions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const response = await fetch('/api/auth/disable-email-confirmation');
      const data = await response.json();
      setInstructions(data);
    } catch (error) {
      console.error('Failed to fetch instructions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">🔧 Fix "Email Not Confirmed" Error</h1>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
          <p className="text-gray-400">
            Solve the "users can sign up but can't sign in" problem by disabling email confirmation.
          </p>
        </div>

        {/* Current Issue */}
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-red-300 mb-4">🚨 Current Issue</h2>
          <div className="space-y-2">
            <p><span className="text-red-400 font-semibold">Problem:</span> <span className="text-white">Users can sign up but can't sign in</span></p>
            <p><span className="text-red-400 font-semibold">Cause:</span> <span className="text-white">Email confirmation is required but users aren't confirming emails</span></p>
            <p><span className="text-green-400 font-semibold">Solution:</span> <span className="text-white">Disable email confirmation for immediate sign-in access</span></p>
          </div>
        </div>

        {/* Quick Fix Button */}
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 mb-6 text-center">
          <h2 className="text-xl font-bold text-green-300 mb-4">⚡ Quick Fix</h2>
          <p className="text-gray-300 mb-4">
            Click this button to open your Supabase dashboard and disable email confirmation:
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Open Supabase Dashboard
          </a>
          <p className="text-green-400 text-sm mt-2">
            This will open in a new tab
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📋 Step-by-Step Instructions</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Go to your Supabase Dashboard</h3>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  https://supabase.com/dashboard
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Select your project</h3>
                <p className="text-gray-300 text-sm">Choose the Snap2Health project</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Navigate to Authentication &gt; Settings</h3>
                <p className="text-blue-400 text-sm">Path: Authentication > Settings</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Find "Enable email confirmations"</h3>
                <p className="text-gray-300 text-sm">This should be under "User confirmation settings"</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">5</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Turn OFF "Enable email confirmations"</h3>
                <p className="text-yellow-400 text-sm">⚠️ This will allow users to sign in immediately after sign up</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">6</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Save the changes</h3>
                <p className="text-green-400 text-sm">✅ Users will no longer need to confirm emails before signing in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits & Considerations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">✅ Benefits</h3>
            <ul className="space-y-2">
              <li className="text-green-400 text-sm">✅ Users can sign in immediately after signup</li>
              <li className="text-green-400 text-sm">✅ No email delivery issues</li>
              <li className="text-green-400 text-sm">✅ No rate limiting problems</li>
              <li className="text-green-400 text-sm">✅ Smoother user experience</li>
              <li className="text-green-400 text-sm">✅ Fixes the "invalid login credentials" error</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">⚠️ Considerations</h3>
            <ul className="space-y-2">
              <li className="text-yellow-400 text-sm">⚠️ Users can sign up with invalid emails</li>
              <li className="text-yellow-400 text-sm">⚠️ No email verification for password resets</li>
              <li className="text-yellow-400 text-sm">⚠️ Consider adding email verification later if needed</li>
            </ul>
          </div>
        </div>

        {/* Alternative Approach */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4">🔄 Alternative Approach</h2>
          <div className="space-y-2">
            <p><span className="text-blue-400 font-semibold">Option:</span> <span className="text-white">Email confirmation optional</span></p>
            <p><span className="text-blue-400 font-semibold">Description:</span> <span className="text-white">Keep confirmation enabled but allow unconfirmed users to sign in</span></p>
            <p><span className="text-blue-400 font-semibold">Setting:</span> <span className="text-white">Look for "Allow unconfirmed users to sign in" option</span></p>
          </div>
        </div>

        {/* Test Authentication */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">🧪 Test After Changes</h2>
          <p className="text-gray-300 mb-4">
            After disabling email confirmation, test the authentication flow:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/signup"
              className="text-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              1. Test Signup
            </Link>
            <Link
              href="/login"
              className="text-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              2. Test Login
            </Link>
            <Link
              href="/debug-auth"
              className="text-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              3. Diagnose Issues
            </Link>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-8 p-4 bg-green-900/50 border border-green-700 rounded-lg text-center">
          <p className="text-green-300 font-semibold">
            🎉 Once disabled, users will be able to sign in immediately after signup!
          </p>
          <p className="text-green-400 text-sm mt-1">
            No more "Email not confirmed" errors
          </p>
        </div>
      </div>
    </div>
  );
} 