/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Configure webpack to handle @/ path aliases
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './app'),
    };
    return config;
  },

  // Optimize images - Allow Supabase storage
  images: {
    domains: [
      'localhost',
      'cyrztlmzanhfybqsakgc.supabase.co', // Current Supabase storage
    ],
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cyrztlmzanhfybqsakgc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Security + cache headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/((?!_next|api|favicon\\.ico|login|signup).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
