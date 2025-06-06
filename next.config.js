/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Explicitly define aliases for Vercel compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const appPath = path.resolve(__dirname, 'app');
    
    // Add comprehensive alias mappings for Vercel Webpack compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      // Root app alias
      '@': appPath,
      
      // Specific directory aliases
      '@/components': path.resolve(appPath, 'components'),
      '@/lib': path.resolve(appPath, 'lib'),
      '@/api': path.resolve(appPath, 'api'),
      '@/utils': path.resolve(appPath, 'lib/utils'),
      
      // Supabase specific aliases
      '@/lib/supabase': path.resolve(appPath, 'lib/supabase'),
      '@/lib/supabase/client': path.resolve(appPath, 'lib/supabase/client.ts'),
      '@/lib/supabase/server': path.resolve(appPath, 'lib/supabase/server.ts'),
      
      // Component specific aliases
      '@/components/client': path.resolve(appPath, 'components/client'),
      '@/components/ui': path.resolve(appPath, 'components/ui'),
      
      // Common utility aliases
      '@/lib/utils': path.resolve(appPath, 'lib/utils'),
      '@/lib/profile-utils': path.resolve(appPath, 'lib/profile-utils.ts'),
      '@/lib/nutrition-utils': path.resolve(appPath, 'lib/nutrition-utils.ts'),
      '@/lib/openai-utils': path.resolve(appPath, 'lib/openai-utils.ts'),
    };
    
    // Disable symlinks for Vercel compatibility
    config.resolve.symlinks = false;
    
    // Add fallback resolution for better module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
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