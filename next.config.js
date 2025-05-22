<<<<<<< HEAD
const path = require('path');
/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ['@supabase/auth-helpers-nextjs'],

  webpack: (config, { isServer }) => {
    // Fix issues with the app directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    
    // Add fallback for browser apis on the server
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    memoryBasedWorkersCount: true,
    strictNextHead: true,
    workerThreads: false,
    cpus: 1
  },
  swcMinify: true,
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
=======
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't use env property as it's not needed for client-side env variables prefixed with NEXT_PUBLIC_
  // Instead, rely on Next.js automatically exposing these variables
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_GPT_VISION: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
    OPENAI_MODEL_GPT_TEXT: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
  },
  // Configure Next.js Image domains to allow Supabase Storage images
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
<<<<<<< HEAD
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 960, 1200],
    imageSizes: [32, 64, 96],
    domains: ['storage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(auth-client-fix\\.js|clear-browser-storage\\.js|cache-invalidate\\.js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'X-Auth-Fix-Script',
            value: 'true',
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
=======
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // For local development with Supabase
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**', 
      },
    ],
    // Make images more responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    unoptimized: true, // Set to true to avoid image optimization issues
  },
};

module.exports = nextConfig; 
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
