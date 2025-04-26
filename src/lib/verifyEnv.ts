/**
 * Verifies that required environment variables are set
 * This is a utility function that can be imported and run in development mode
 * to check if environment variables are properly loaded
 */

export function verifyEnvironment() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***KEY EXISTS***' : undefined,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***KEY EXISTS***' : undefined,
    OPENAI_MODEL_GPT_VISION: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
    OPENAI_MODEL_GPT_TEXT: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
  };

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('⚠️ Missing required environment variables:', missingVars.join(', '));
    console.error('Make sure .env.local exists and contains the required variables.');
    return false;
  }

  console.log('✅ All required environment variables are set.');
  return true;
}

// Automatically run verification in development
if (process.env.NODE_ENV === 'development') {
  verifyEnvironment();
} 