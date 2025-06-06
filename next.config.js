/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Explicitly define aliases for Vercel compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const appPath = path.resolve(__dirname, 'app');
    
    // Add explicit alias mappings
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': appPath,
      '@/components': path.resolve(appPath, 'components'),
      '@/lib': path.resolve(appPath, 'lib'),
      '@/api': path.resolve(appPath, 'api'),
      '@/lib/supabase/client': path.resolve(appPath, 'lib/supabase/client.ts'),
    };
    
    // Disable symlinks for Vercel compatibility
    config.resolve.symlinks = false;
    
    return config;
  },

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  
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
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 