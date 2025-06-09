'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DiagnosisResult {
  email: string;
  timestamp: string;
  tests: {
    userExists: boolean;
    emailConfirmed: boolean;
    canSignIn: boolean;
    accountLocked: boolean;
    lastSignIn: string | null;
    errorDetails: {
      message: string;
      status?: number;
      name?: string;
      type?: string;
    } | null;
  };
  userMetadata?: {
    id: string;
    createdAt: string;
    emailConfirmedAt: string | null;
    bannedUntil: string | null;
    provider: string;
  };
  likelyCause?: string;
  recommendation?: string;
  adminError?: string;
  adminWarning?: string;
  authSettings: {
    signUpEnabled: string;
    emailConfirmationRequired: string;
    passwordMinLength: string;
    rateLimiting: string;
  };
  solutions: {
    forUser: string[];
    forAdmin: string[];
  };
}

export default function AuthDebugPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState('');

  const runDiagnosis = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setDiagnosis(null);

    try {
      const response = await fetch('/api/auth/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setDiagnosis(result.diagnosis);
      } else {
        setError(result.error || 'Diagnosis failed');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getCauseColor = (cause?: string) => {
    switch (cause) {
      case 'email_not_confirmed':
        return 'text-yellow-400';
      case 'password_mismatch_or_unconfirmed_email':
        return 'text-orange-400';
      case 'rate_limited':
        return 'text-purple-400';
      case 'user_not_found':
        return 'text-red-400';
      case 'system_error':
        return 'text-red-500';
      case 'authentication_working':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">🔍 Authentication Diagnosis</h1>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
          <p className="text-gray-400">
            Diagnose why users can sign up but can't sign in. Enter an email address to analyze authentication issues.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address to diagnose"
              className="flex-1 px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={runDiagnosis}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Diagnosing...' : 'Run Diagnosis'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Diagnosis Results */}
        {diagnosis && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">📋 Diagnosis Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Email:</p>
                  <p className="text-white font-mono">{diagnosis.email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Timestamp:</p>
                  <p className="text-white font-mono">{new Date(diagnosis.timestamp).toLocaleString()}</p>
                </div>
                {diagnosis.likelyCause && (
                  <div className="md:col-span-2">
                    <p className="text-gray-400">Likely Cause:</p>
                    <p className={`font-semibold ${getCauseColor(diagnosis.likelyCause)}`}>
                      {diagnosis.likelyCause.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                )}
                {diagnosis.recommendation && (
                  <div className="md:col-span-2">
                    <p className="text-gray-400">Recommendation:</p>
                    <p className="text-yellow-300">{diagnosis.recommendation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">🧪 Test Results</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">User exists in database</span>
                  <span className="text-lg">{getStatusIcon(diagnosis.tests.userExists)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Email confirmed</span>
                  <span className="text-lg">{getStatusIcon(diagnosis.tests.emailConfirmed)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Account locked/banned</span>
                  <span className="text-lg">{diagnosis.tests.accountLocked ? '⚠️' : '✅'}</span>
                </div>
                {diagnosis.tests.lastSignIn && (
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <span className="text-gray-300">Last sign in</span>
                    <span className="text-white font-mono text-sm">
                      {new Date(diagnosis.tests.lastSignIn).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Metadata */}
            {diagnosis.userMetadata && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">👤 User Metadata</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
                  <div>
                    <p className="text-gray-400">User ID:</p>
                    <p className="text-white break-all">{diagnosis.userMetadata.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Created At:</p>
                    <p className="text-white">{new Date(diagnosis.userMetadata.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email Confirmed At:</p>
                    <p className="text-white">
                      {diagnosis.userMetadata.emailConfirmedAt 
                        ? new Date(diagnosis.userMetadata.emailConfirmedAt).toLocaleString()
                        : 'Not confirmed'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Provider:</p>
                    <p className="text-white">{diagnosis.userMetadata.provider || 'email'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Details */}
            {diagnosis.tests.errorDetails && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">⚠️ Error Details</h2>
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 font-semibold mb-2">
                    {diagnosis.tests.errorDetails.message}
                  </p>
                  {diagnosis.tests.errorDetails.status && (
                    <p className="text-red-400 text-sm">
                      Status: {diagnosis.tests.errorDetails.status}
                    </p>
                  )}
                  {diagnosis.tests.errorDetails.name && (
                    <p className="text-red-400 text-sm">
                      Error Type: {diagnosis.tests.errorDetails.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Solutions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Solutions */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">👥 Solutions for Users</h3>
                <ul className="space-y-2">
                  {diagnosis.solutions.forUser.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span className="text-gray-300">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Admin Solutions */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">🔧 Solutions for Admins</h3>
                <ul className="space-y-2">
                  {diagnosis.solutions.forAdmin.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span className="text-gray-300">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Auth Settings */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">⚙️ Auth Settings to Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(diagnosis.authSettings).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-yellow-300 text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {(diagnosis.adminError || diagnosis.adminWarning) && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">⚠️ Warnings</h2>
                {diagnosis.adminError && (
                  <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg mb-3">
                    <p className="text-red-300">{diagnosis.adminError}</p>
                  </div>
                )}
                {diagnosis.adminWarning && (
                  <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                    <p className="text-yellow-300">{diagnosis.adminWarning}</p>
                    <p className="text-yellow-400 text-sm mt-2">
                      Add SUPABASE_SERVICE_ROLE_KEY to your environment variables for full diagnosis capabilities.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Common Issues Guide */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📚 Common Sign-in Issues</h2>
          <div className="space-y-4">
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-900/20">
              <h3 className="font-semibold text-yellow-300 mb-2">Email Not Confirmed</h3>
              <p className="text-gray-300 text-sm">
                Most common issue. Users sign up but don't verify their email before trying to sign in.
                Check if email confirmations are enabled in Supabase.
              </p>
            </div>
            <div className="p-4 border-l-4 border-red-500 bg-red-900/20">
              <h3 className="font-semibold text-red-300 mb-2">Invalid Credentials</h3>
              <p className="text-gray-300 text-sm">
                Password mismatch or user doesn't exist. This error is often generic for security reasons.
              </p>
            </div>
            <div className="p-4 border-l-4 border-purple-500 bg-purple-900/20">
              <h3 className="font-semibold text-purple-300 mb-2">Rate Limiting</h3>
              <p className="text-gray-300 text-sm">
                Too many failed attempts. Users need to wait before trying again.
              </p>
            </div>
            <div className="p-4 border-l-4 border-blue-500 bg-blue-900/20">
              <h3 className="font-semibold text-blue-300 mb-2">Configuration Issues</h3>
              <p className="text-gray-300 text-sm">
                Check Supabase auth settings, environment variables, and database connectivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 