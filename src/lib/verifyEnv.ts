/**
 * Verifies that required environment variables are set
 * This is a utility function that can be imported and run in development mode
 * to check if environment variables are properly loaded
 */

'use client';

// Only run in client side and during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Verify required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const optionalEnvVars = [
    'OPENAI_API_KEY',
  ];
  
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  // Log missing variables to console
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:', missingRequired.join(', '));
    console.error('Please create a .env.local file with these variables');
  } else {
    console.log('✅ All required environment variables are set.');
  }
  
  if (missingOptional.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', missingOptional.join(', '));
  }

  // Display a warning if auth bypass is enabled
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
    console.warn('⚠️ AUTH COMPLETELY DISABLED FOR TESTING - REMOVE BEFORE PRODUCTION ⚠️');
  }
} 