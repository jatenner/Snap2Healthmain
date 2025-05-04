/** @type {import('next').NextConfig} */

/**
 * Ultra-lightweight Next.js configuration
 * For development use in memory-constrained environments
 * 
 * This configuration sacrifices some development features for memory efficiency
 */

const nextConfig = {
  // Set output to standalone for independent operation
  output: 'standalone',
  
  // Optimize CSS for smaller memory footprint
  experimental: {
    // Optimize CSS output for reduced memory
    optimizeCss: true,
    // Disable memory-intensive features
    mdxRs: false,
    serverComponentsExternalPackages: [],
    // Set memory-based workers allocation
    memoryBasedWorkersCount: true,
    // Enforce strict head rendering to prevent duplicate tags
    strictNextHead: true,
    // Disable worker threads for lower memory usage
    workerThreads: false,
    // Use only 1 CPU core to minimize parallel processing memory usage
    cpus: 1,
    // Disable JIT compilation to save memory
    turbotrace: {
      enabled: false
    }
  },
  
  // Enable SWC minification for smaller bundles
  swcMinify: true,
  
  // Disable React strict mode in development to reduce memory consumption from double-renders
  reactStrictMode: false,
  
  // Keep pages in memory for less time
  onDemandEntries: {
    maxInactiveAge: 10 * 1000, // Only 10 seconds
    pagesBufferLength: 1, // Only keep 1 page in memory
  },
  
  // Minimize image optimization memory usage
  images: {
    // Only allow Snap2Health domains + default
    domains: ['localhost'],
    // Reduce memory usage from image optimization
    minimumCacheTTL: 3600, // Cache for 1 hour to prevent regeneration
    deviceSizes: [640, 1200], // Only 2 sizes
    imageSizes: [32, 96],     // Only 2 sizes
    // Disable animated image processing to save memory
    disableStaticImages: true,
    // Limit concurrent image optimization tasks
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Set very aggressive cache-busting and memory management headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          }
        ],
      },
    ];
  },
  
  // Disable type checking during development to save memory
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "tsconfig.light.json",
  },
  
  // Disable ESLint during development to save memory
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [],
  },
  
  // Optimize webpack configurations for lower memory usage
  webpack: (config, { dev }) => {
    // Apply memory optimizations only in development
    if (dev) {
      // Disable source maps to reduce memory usage
      config.devtool = false;
      
      // Limit parallel operations
      config.parallelism = 1;
      
      // Disable persistent caching
      config.cache = false;
      
      // Basic optimizations to reduce bundle size
      config.optimization = {
        ...config.optimization,
        nodeEnv: 'development',
        minimize: false,
        // Disable expensive optimizations
        splitChunks: {
          chunks: 'async',
          minSize: 20000,
          minRemainingSize: 0,
          minChunks: 1,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 