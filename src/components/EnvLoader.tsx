'use client';

import Script from 'next/script';

// This component injects environment variables into the window object
// Uses next/script for more reliable injection in production
export default function EnvLoader() {
  // Create the script content that will run when the page loads
  const envScript = `
    window.ENV = {
      NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
      NEXT_PUBLIC_MOCK_AUTH: "${process.env.NEXT_PUBLIC_MOCK_AUTH || 'false'}",
      NEXT_PUBLIC_AUTH_BYPASS: "${process.env.NEXT_PUBLIC_AUTH_BYPASS || 'true'}", // Enable auth bypass by default
      NEXT_PUBLIC_APP_ENV: "${process.env.NEXT_PUBLIC_APP_ENV || 'development'}"
    };
    console.log('Environment variables loaded to window.ENV');
  `;

  return (
    <Script 
      id="env-script" 
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: envScript }} 
    />
  );
} 