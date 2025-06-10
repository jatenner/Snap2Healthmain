'use client';

import React, { useState, useEffect } from 'react';

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuthDebugInfo();
  }, []);

  const fetchAuthDebugInfo = async () => {
    setIsLoading(true);
    
    try {
      // Check current auth status
      const { createClient } = await import('../lib/supabase/client');
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      setAuthStatus({
        hasSession: !!session,
        user: session?.user || null,
        sessionError: sessionError?.message || null
      });

      // Fetch recent users to see if new signups are working
      const response = await fetch('/api/admin/confirm-all-users');
      if (response.ok) {
        const userData = await response.json();
        setRecentUsers(userData);
      }
    } catch (error) {
      console.error('Debug fetch error:', error);
    }
    
    setIsLoading(false);
  };

  const testAutoConfirm = async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const response = await fetch('/api/auth/auto-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User'
        })
      });

      const result = await response.json();
      alert(`Auto-confirm test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(result, null, 2)}`);
      
      // Refresh the data
      fetchAuthDebugInfo();
    } catch (error) {
      alert(`Auto-confirm test failed: ${error}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading debug info...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 Auth Debug Dashboard</h1>
        
        {/* Current Session Status */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
          <div className={`p-4 rounded ${authStatus?.hasSession ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
            <div className={`font-semibold ${authStatus?.hasSession ? 'text-green-300' : 'text-red-300'}`}>
              {authStatus?.hasSession ? '✅ User is signed in' : '❌ No active session'}
            </div>
            {authStatus?.user && (
              <div className="text-gray-300 text-sm mt-2">
                User: {authStatus.user.email} (ID: {authStatus.user.id})
              </div>
            )}
            {authStatus?.sessionError && (
              <div className="text-red-400 text-sm mt-2">
                Session Error: {authStatus.sessionError}
              </div>
            )}
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">User Statistics</h2>
          {recentUsers ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/50 p-4 rounded">
                <div className="text-blue-300 text-2xl font-bold">{recentUsers.totalUsers || 0}</div>
                <div className="text-blue-200 text-sm">Total Users</div>
              </div>
              <div className="bg-green-900/50 p-4 rounded">
                <div className="text-green-300 text-2xl font-bold">{recentUsers.confirmedUsers || 0}</div>
                <div className="text-green-200 text-sm">Confirmed Users</div>
              </div>
              <div className="bg-red-900/50 p-4 rounded">
                <div className="text-red-300 text-2xl font-bold">{recentUsers.unconfirmedUsers || 0}</div>
                <div className="text-red-200 text-sm">Unconfirmed Users</div>
              </div>
              <div className="bg-purple-900/50 p-4 rounded">
                <div className="text-purple-300 text-2xl font-bold">
                  {recentUsers.unconfirmedUsers === 0 ? '🎉' : '⚠️'}
                </div>
                <div className="text-purple-200 text-sm">
                  {recentUsers.unconfirmedUsers === 0 ? 'All Good!' : 'Issues Detected'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Failed to load user statistics</div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Tests</h2>
          <div className="space-y-3">
            <button
              onClick={testAutoConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold"
            >
              🧪 Test Auto-Confirm Signup
            </button>
            <button
              onClick={fetchAuthDebugInfo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Recent Users List */}
        {recentUsers?.users && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Users (Last 10)</h2>
            <div className="space-y-2">
              {recentUsers.users.slice(0, 10).map((user: any, index: number) => (
                <div
                  key={user.id}
                  className={`p-3 rounded border ${
                    user.email_confirmed_at
                      ? 'bg-green-900/30 border-green-700'
                      : 'bg-red-900/30 border-red-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{user.email}</div>
                      <div className="text-gray-400 text-sm">
                        Created: {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.email_confirmed_at
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {user.email_confirmed_at ? '✅ Confirmed' : '❌ Unconfirmed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <a href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Go to Signup
          </a>
          <a href="/test-signup" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Test Signup Page
          </a>
          <a href="/login" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
} 