/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't use hardcoded env properties, let Vercel handle them
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    NEXT_PUBLIC_MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH || 'false',
    NEXT_PUBLIC_AUTH_BYPASS: process.env.NEXT_PUBLIC_AUTH_BYPASS || 'false',
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_GPT_VISION: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
    OPENAI_MODEL_GPT_TEXT: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
  },
  // Configure Next.js Image domains to allow Supabase Storage images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Make images more responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    unoptimized: process.env.NODE_ENV === 'development', // Only unoptimized in development
    domains: ['localhost', 'cyrztlmzanhfybqsakgc.supabase.co'],
  },
  // Handle Node.js modules in client components
  experimental: {
    esmExternals: true,
  },
  // Configure webpack to handle node modules in browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client to prevent them from being included
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
  // Set the app directory correctly
  distDir: '.next',
  // Ignore TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Remove hardcoded environment variables, use Vercel environment variables instead
};

module.exports = nextConfig; 