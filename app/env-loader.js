'use client';

// Simple environment variable loader for client-side use

export default function EnvLoader() {
  // Only run in browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Initialize window.ENV
  if (!window.ENV) {
    window.ENV = {};
  }

  // Set environment variables
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = 'https://cyrztlmzanhfybqsakgc.supabase.co';
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE';
  window.ENV.NEXT_PUBLIC_MOCK_AUTH = 'true';
  window.ENV.NEXT_PUBLIC_AUTH_BYPASS = 'true';
  window.ENV.NEXT_PUBLIC_APP_ENV = 'development';

  // Expose a setup function for the console
  window.setupEnv = function() {
    console.log('Environment variables are set in window.ENV');
  };

  return null;
} 