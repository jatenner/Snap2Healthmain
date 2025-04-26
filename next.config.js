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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
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