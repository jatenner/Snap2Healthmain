'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConfirmUsersPage() {
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/confirm-all-users');
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAllUsers = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch('/api/admin/confirm-all-users', {
        method: 'POST'
      });
      const data = await response.json();
      setResults(data);
      
      // Refresh stats
      await fetchUserStats();
    } catch (error) {
      console.error('Failed to confirm users:', error);
      setResults({ error: 'Failed to confirm users' });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading user stats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">👥 Manual User Confirmation</h1>
            <Link 
              href="/" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
          <p className="text-gray-400">
            Since we can't find the email confirmation setting, let's manually confirm users who are stuck.
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Current User Status</h2>
          
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{userStats.total_users}</div>
                <div className="text-sm text-blue-300">Total Users</div>
              </div>
              
              <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{userStats.confirmed_users}</div>
                <div className="text-sm text-green-300">Confirmed Users</div>
              </div>
              
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{userStats.unconfirmed_users}</div>
                <div className="text-sm text-red-300">Unconfirmed Users</div>
              </div>
            </div>
          )}

          {userStats?.unconfirmed_emails && userStats.unconfirmed_emails.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white font-semibold mb-2">Unconfirmed Email Addresses:</h3>
              <div className="bg-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                {userStats.unconfirmed_emails.map((email: string, index: number) => (
                  <div key={index} className="text-gray-300 text-sm">{email}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {userStats?.unconfirmed_users > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">🔧 Fix Authentication Issues</h2>
            <p className="text-gray-400 mb-4">
              This will manually confirm all {userStats.unconfirmed_users} unconfirmed users so they can sign in immediately.
            </p>
            
            <button
              onClick={confirmAllUsers}
              disabled={isConfirming}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isConfirming 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isConfirming ? '⏳ Confirming Users...' : '✅ Confirm All Users'}
            </button>
          </div>
        )}

        {userStats?.unconfirmed_users === 0 && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6">
            <h2 className="text-green-400 font-semibold text-xl">🎉 All Users Confirmed!</h2>
            <p className="text-green-300">
              All users are now confirmed and can sign in without issues.
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📋 Confirmation Results</h2>
            
            {results.summary && (
              <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                <div className="text-green-400">✅ Successfully confirmed: {results.summary.successfully_confirmed}</div>
                <div className="text-red-400">❌ Errors: {results.summary.errors}</div>
              </div>
            )}

            {results.results && (
              <div className="max-h-64 overflow-y-auto">
                {results.results.map((result: any, index: number) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded mb-2 ${
                      result.status === 'confirmed' 
                        ? 'bg-green-900/30 border border-green-500' 
                        : 'bg-red-900/30 border border-red-500'
                    }`}
                  >
                    <div className="text-white font-mono text-sm">{result.email}</div>
                    <div className={`text-xs ${
                      result.status === 'confirmed' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {result.status === 'confirmed' ? '✅ Confirmed' : `❌ ${result.error}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 