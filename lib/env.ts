/**
 * Environment Variables
 * 
 * This module provides centralized access to environment variables
 * ensuring they're available consistently across the application
 */

// Define environment variable schema
interface EnvVariables {
  // Supabase settings
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Application settings
  NEXT_PUBLIC_APP_ENV: string;
  NEXT_PUBLIC_API_URL: string;
  
  // OpenAI settings
  OPENAI_API_KEY: string;
  OPENAI_MODEL_GPT_VISION: string;
  
  // Feature flags
  NEXT_PUBLIC_USE_MOCK_ANALYSIS: string;
}

const defaultValues: EnvVariables = {
  // Default Supabase values - ensure these match .env.local
  NEXT_PUBLIC_SUPABASE_URL: "https://cyrztlmzanhfybqsakgc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE",
  
  // Default application values
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_API_URL: "/api",
  
  // OpenAI values - redacted since these shouldn't be hardcoded in client code
  OPENAI_API_KEY: "",
  OPENAI_MODEL_GPT_VISION: "gpt-4o",
  
  // Feature flags
  NEXT_PUBLIC_USE_MOCK_ANALYSIS: "false",
};

/**
 * Get environment variables with fallbacks
 * 
 * This function prioritizes:
 * 1. process.env from Node.js
 * 2. window.env injected values
 * 3. Default hardcoded values as last resort
 */
export function getEnvVariables(): EnvVariables {
  // Start with default values
  const env = { ...defaultValues };
  
  // Browser environment
  if (typeof window !== 'undefined') {
    // Inject on window object for global access
    if (!window.ENV) window.ENV = {};
    if (!window.__ENV) window.__ENV = {};
    
    // Get variables from window objects if they exist
    Object.keys(defaultValues).forEach((key) => {
      const typedKey = key as keyof EnvVariables;
      
      // Check Next.js public environment variables
      if (process.env[typedKey]) {
        env[typedKey] = process.env[typedKey] as string;
      }
      
      // Check window.ENV
      if (window.ENV && window.ENV[typedKey]) {
        env[typedKey] = window.ENV[typedKey] as string;
      }
      
      // Also check window.__ENV which some scripts might use
      if (window.__ENV && window.__ENV[typedKey]) {
        env[typedKey] = window.__ENV[typedKey] as string;
      }
    });
    
    // Inject all environment variables to window objects
    Object.keys(env).forEach((key) => {
      const typedKey = key as keyof EnvVariables;
      window.ENV[typedKey] = env[typedKey];
      window.__ENV[typedKey] = env[typedKey];
      
      // Also set in process.env for libraries that might check there
      if (!window.process) window.process = {};
      if (!window.process.env) window.process.env = {};
      window.process.env[typedKey] = env[typedKey];
    });
    
    console.log('[ENV] Environment variables initialized in browser');
  } 
  // Server environment
  else {
    // On server, we can directly access process.env
    Object.keys(defaultValues).forEach((key) => {
      const typedKey = key as keyof EnvVariables;
      if (process.env[typedKey]) {
        env[typedKey] = process.env[typedKey] as string;
      }
    });
    
    console.log('[ENV] Environment variables initialized on server');
  }
  
  return env;
}

// Get environment variables
const envVariables = getEnvVariables();

// Add TypeScript declarations
declare global {
  interface Window {
    ENV: Record<string, any>;
    __ENV: Record<string, any>;
    process?: {
      env?: Record<string, any>;
    };
  }
}

// Export individual variables for convenience
export const SUPABASE_URL = envVariables.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = envVariables.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const APP_ENV = envVariables.NEXT_PUBLIC_APP_ENV;
export const API_URL = envVariables.NEXT_PUBLIC_API_URL;
export const USE_MOCK_ANALYSIS = envVariables.NEXT_PUBLIC_USE_MOCK_ANALYSIS === 'true';

// Export the whole object as default
export default envVariables; 