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
const isProduction = process.env.NODE_ENV === 'production';

// Environment variable validation - simplified for Vercel compatibility
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
  
  if (isProduction) {
    console.log('[next.config.js] Running in PRODUCTION mode');
    // In production, just warn about missing variables but don't fail
    if (missing.length > 0) {
      console.log(`[next.config.js] WARNING: Missing environment variables in production:`);
      missing.forEach(envVar => {
        console.log(`[next.config.js] - ${envVar}`);
      });
    }
  } else {
    console.log('[next.config.js] Running in DEVELOPMENT mode');
    // Only throw error in development
    if (missing.length > 0) {
      console.log(`[next.config.js] ERROR: Missing required environment variables:`);
      missing.forEach(envVar => {
        console.log(`[next.config.js] - ${envVar}`);
      });
      console.log('[next.config.js] Please set these variables in .env.local');
      throw new Error('Missing required environment variables');
    }
  }
}

// Run validation
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('[next.config.js] Environment validation failed:', error.message);
  if (!isProduction) {
    throw error;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified configuration for Vercel
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
    unoptimized: isProduction
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

  // Disable TypeScript and ESLint errors during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Custom page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig;
