// Load environment variables from .env.local and .env.production
const path = require('path');
const fs = require('fs');

// Load .env.local if it exists (development)
const dotenvLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(dotenvLocalPath)) {
  require('dotenv').config({ path: dotenvLocalPath });
  console.log('[next.config.js] Loaded environment from .env.local');
}

// Load .env.production if in production mode
if (process.env.NODE_ENV === 'production') {
  const dotenvProdPath = path.resolve(process.cwd(), '.env.production');
  if (fs.existsSync(dotenvProdPath)) {
    require('dotenv').config({ path: dotenvProdPath });
    console.log('[next.config.js] Loaded environment from .env.production');
  }
}

// Check for development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isAuthBypassEnabled = isDevelopment && (process.env.AUTH_BYPASS === 'true' || process.env.DEV_MODE === 'true');

// Validate required environment variables
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

// Check for missing environment variables
const missingEnvVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

// Validate Supabase URL format
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseDomain = '';

try {
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    supabaseDomain = url.hostname;
  }
} catch (e) {
  console.error('[next.config.js] Invalid NEXT_PUBLIC_SUPABASE_URL format:', supabaseUrl);
  missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL (invalid format)');
}

// Log environment variable status
console.log('[next.config.js] Checking environment variables at startup:');
REQUIRED_ENV_VARS.forEach(varName => {
  const status = process.env[varName] ? 'OK' : 'MISSING';
  console.log(`[next.config.js] ${varName}: ${status}`);
});

// Fail build if required environment variables are missing
if (missingEnvVars.length > 0) {
  console.error('\n[next.config.js] ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`[next.config.js] - ${varName}`);
  });
  console.error('[next.config.js] Please set these variables in .env.local or .env.production');
  
  // Always throw an error to stop the build
  throw new Error('Missing required environment variables');
}

// Display startup time for logging
console.log(`[next.config.js] Server startup time: ${new Date().toISOString()}`);
console.log(`[next.config.js] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

if (isDevelopment) {
  console.log('[next.config.js] Running in DEVELOPMENT mode');
  
  if (isAuthBypassEnabled) {
    console.log('[next.config.js] Authentication bypass is ENABLED');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone for production deployment
  output: isDevelopment ? undefined : 'standalone',
  
  // Essential settings
  experimental: {
    largePageDataBytes: 128 * 100000,
  },

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    unoptimized: process.env.NODE_ENV === 'production'
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Disable TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Custom page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

// Environment variable validation for production
function validateEnvironmentVariables() {
  console.log('[next.config.js] Checking environment variables at startup:');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  const missing = [];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`[next.config.js] ${envVar}: OK`);
    } else {
      console.log(`[next.config.js] ${envVar}: MISSING`);
      missing.push(envVar);
    }
  });

  console.log(`[next.config.js] Server startup time: ${new Date().toISOString()}`);
  console.log(`[next.config.js] NODE_ENV: ${process.env.NODE_ENV}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('[next.config.js] Running in PRODUCTION mode');
  } else {
    console.log('[next.config.js] Running in DEVELOPMENT mode');
  }

  // Only throw error in development - let production continue with warnings
  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log(`[next.config.js] ERROR: Missing required environment variables:`);
    missing.forEach(envVar => {
      console.log(`[next.config.js] - ${envVar}`);
    });
    console.log('[next.config.js] Please set these variables in .env.local or .env.production');
    throw new Error('Missing required environment variables');
  } else if (missing.length > 0) {
    console.log(`[next.config.js] WARNING: Missing environment variables in production:`);
    missing.forEach(envVar => {
      console.log(`[next.config.js] - ${envVar}`);
    });
  }
}

// Run validation
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('[next.config.js] Environment validation failed:', error.message);
  if (process.env.NODE_ENV !== 'production') {
    throw error;
  }
}

module.exports = nextConfig;
