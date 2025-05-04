/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    memoryBasedWorkersCount: true,
    strictNextHead: true,
    workerThreads: false,
    cpus: 1
  },
  swcMinify: true,
  reactStrictMode: process.env.NODE_ENV === 'production',
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    domains: ['localhost', 'snap2health.com', 'www.snap2health.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 960, 1200],
    imageSizes: [32, 64, 96],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
};

module.exports = nextConfig;
