/**
 * Environment Checker Utility
 * 
 * This module provides functions to check and validate environment variables
 * on the server side, ensuring the application has the necessary configuration.
 */

// Helper function to check if a string value is valid
function isValidString(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

// Fix line breaks in API keys
export function fixApiKey(key: string | undefined): string | null {
  if (!key) return null;
  return key.replace(/\s+/g, '');
}

// Check if OpenAI API key is available
export function checkOpenAIKey(): {
  available: boolean;
  source: string;
  key: string | null;
} {
  // Check for direct API key
  let key = process.env.OPENAI_API_KEY;
  if (isValidString(key)) {
    return {
      available: true,
      source: 'OPENAI_API_KEY',
      key: fixApiKey(key)
    };
  }
  
  // Check for fallback key
  key = process.env.OPENAI_API_KEY_FALLBACK;
  if (isValidString(key)) {
    return {
      available: true,
      source: 'OPENAI_API_KEY_FALLBACK',
      key: fixApiKey(key)
    };
  }
  
  // Check for public key (not recommended but might be used in some setups)
  key = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (isValidString(key)) {
    return {
      available: true,
      source: 'NEXT_PUBLIC_OPENAI_API_KEY',
      key: fixApiKey(key)
    };
  }
  
  // No key found
  return {
    available: false,
    source: 'none',
    key: null
  };
}

// Check if OpenAI model is correctly configured
export function checkOpenAIModel(): {
  configured: boolean;
  model: string;
  isCorrect: boolean;
} {
  const configuredModel = process.env.OPENAI_MODEL;
  const recommendedModel = 'gpt-4o';
  
  // Check if model is configured
  if (!isValidString(configuredModel)) {
    return {
      configured: false,
      model: recommendedModel, // Default to recommended model
      isCorrect: false
    };
  }
  
  // Check if model matches recommended model
  return {
    configured: true,
    model: configuredModel!,
    isCorrect: configuredModel === recommendedModel
  };
}

// Check if Supabase is properly configured
export function checkSupabaseConfig(): {
  available: boolean;
  url: string | null;
  anonKey: string | null;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  return {
    available: isValidString(url) && isValidString(anonKey),
    url: isValidString(url) ? url! : null,
    anonKey: isValidString(anonKey) ? anonKey! : null
  };
}

// Get overall environment status
export function getEnvironmentStatus(): {
  openai: { available: boolean; source: string; model: string };
  supabase: { available: boolean };
  nodeEnv: string;
  isProduction: boolean;
} {
  const openaiKey = checkOpenAIKey();
  const openaiModel = checkOpenAIModel();
  const supabase = checkSupabaseConfig();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    openai: {
      available: openaiKey.available,
      source: openaiKey.source,
      model: openaiModel.model
    },
    supabase: {
      available: supabase.available
    },
    nodeEnv,
    isProduction: nodeEnv === 'production'
  };
}

// Export default function for easy usage
export default function checkEnvironment(): {
  valid: boolean;
  status: ReturnType<typeof getEnvironmentStatus>;
  missingVars: string[];
} {
  const status = getEnvironmentStatus();
  const missingVars: string[] = [];
  
  // Check for critical missing variables
  if (!status.openai.available) {
    missingVars.push('OPENAI_API_KEY');
  }
  
  if (!status.supabase.available) {
    missingVars.push('SUPABASE_URL/ANON_KEY');
  }
  
  return {
    valid: missingVars.length === 0,
    status,
    missingVars
  };
} 