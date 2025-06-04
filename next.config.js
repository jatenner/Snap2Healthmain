/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Experimental features
  experimental: {
    appDir: true,
  },

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: false,
  },

  // Enhanced Webpack configuration for bulletproof Vercel compatibility
  webpack: (config, { buildId, dev, isServer, nextRuntime, webpack }) => {
    // Environment check logging
    console.log(`[next.config.js] Webpack build: dev=${dev}, isServer=${isServer}`);
    
    // BULLETPROOF ALIAS CONFIGURATION FOR VERCEL
    const appPath = path.resolve(__dirname, './app');
    
    // Clear and rebuild alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      // Primary alias mapping with explicit trailing slash handling
      '@': appPath,
      '@/': appPath + '/',
      // Specific subdirectory aliases for explicit resolution
      '@/components': path.resolve(appPath, 'components'),
      '@/lib': path.resolve(appPath, 'lib'),
      '@/api': path.resolve(appPath, 'api'),
      '@/types': path.resolve(appPath, 'types'),
      '@/context': path.resolve(appPath, 'context'),
      // Explicit supabase client mapping for Vercel
      '@/lib/supabase/client': path.resolve(appPath, 'lib/supabase/client.ts'),
      '@/lib/supabase/server': path.resolve(appPath, 'lib/supabase/server.ts'),
    };

    // EXTENSION RESOLUTION WITH FALLBACKS
    config.resolve.extensions = [
      '.ts',
      '.tsx', 
      '.js',
      '.jsx',
      '.json',
      '.mjs',
      ...(config.resolve.extensions || [])
    ];

    // DISABLE SYMLINKS FOR VERCEL COMPATIBILITY
    config.resolve.symlinks = false;

    // ENHANCED MODULE RESOLUTION ORDER
    config.resolve.modules = [
      appPath,
      path.resolve(__dirname, './'),
      'node_modules',
      ...(config.resolve.modules || [])
    ];

    // VERCEL-SPECIFIC OPTIMIZATIONS
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.resolve.mainFields = ['browser', 'module', 'main'];
    }

    return config;
  },

  // Simple headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 