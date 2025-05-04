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
  output: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT === 'true' ? 'export' : undefined,
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
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
