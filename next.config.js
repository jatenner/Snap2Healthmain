/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Vercel-specific webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Don't modify aliases in development to avoid breaking local development
    if (dev) {
      return config;
    }

    const appPath = path.resolve(__dirname, 'app');
    
    // Simpler, more reliable alias configuration for Vercel production builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': appPath,
      '@/components': path.resolve(appPath, 'components'),
      '@/lib': path.resolve(appPath, 'lib'),
      '@/api': path.resolve(appPath, 'api'),
    };
    
    // Add module resolution directories for better path resolution
    config.resolve.modules = [
      path.resolve(__dirname, 'app'),
      'node_modules'
    ];
    
    // Ensure proper extension resolution
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
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