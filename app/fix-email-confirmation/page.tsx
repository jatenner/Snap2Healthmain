'use client';

import React from 'react';
import Link from 'next/link';

export default function FixEmailConfirmationPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">🔧 Fix Email Confirmation Issue</h1>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <h2 className="text-red-400 font-semibold mb-2">🚨 Current Problem:</h2>
            <p className="text-red-300">
              Users can sign up but can't sign in because email confirmation is enabled. 
              You're also hitting email rate limits (30 emails/hour on free tier).
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Method 1 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">📋 Method 1: Project Settings</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <h3 className="text-white font-semibold">Go to Project Settings</h3>
                  <p className="text-gray-400 text-sm">Click the gear/settings icon at the bottom of the left sidebar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <h3 className="text-white font-semibold">Find Authentication Section</h3>
                  <p className="text-gray-400 text-sm">Look for "Auth" or "Authentication" in the settings menu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <h3 className="text-white font-semibold">Disable Email Confirmations</h3>
                  <p className="text-gray-400 text-sm">Turn OFF "Enable email confirmations" toggle</p>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">🔧 Method 2: SQL Command</h2>
            <p className="text-gray-400 mb-4">If you can't find the setting, run this SQL in your Supabase SQL Editor:</p>
            <div className="bg-slate-900 rounded border p-4 mb-4">
              <code className="text-green-400 text-sm">
                {`UPDATE auth.config 
SET enable_confirmations = false 
WHERE 1=1;`}
              </code>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">!</span>
              <p className="text-orange-300 text-sm">
                <strong>Note:</strong> This directly modifies the auth configuration. Use with caution.
              </p>
            </div>
          </div>

          {/* What this fixes */}
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6">
            <h2 className="text-green-400 font-semibold mb-4">✅ What This Will Fix:</h2>
            <ul className="space-y-2 text-green-300">
              <li>• Users can sign up AND sign in immediately</li>
              <li>• No more "Email not confirmed" errors</li>
              <li>• Reduces email rate limit usage</li>
              <li>• Existing users who couldn't sign in will now be able to</li>
            </ul>
          </div>

          {/* Test it */}
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
            <h2 className="text-blue-400 font-semibold mb-4">🧪 Test After Disabling:</h2>
            <div className="space-y-2">
              <Link 
                href="/signup" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
              >
                Test Sign Up
              </Link>
              <Link 
                href="/login" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4"
              >
                Test Sign In
              </Link>
              <Link 
                href="/debug-auth" 
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Debug Auth Issues
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 