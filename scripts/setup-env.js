// This script can be included in your application to set up mock environment variables
// Run this in the browser console if you're having auth issues

function setupEnvironment() {
  // Supabase credentials
  localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', 'https://cyrztlmzanhfybqsakgc.supabase.co');
  localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnp0bG16YW5oZnlicXNha2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE3OTUsImV4cCI6MjA2MTE5Nzc5NX0.weWEWeSASoOGhXC6Gg5diwCBffxdV2NjuaHjjHkq3SE');

  // Auth flags
  localStorage.setItem('MOCK_AUTH', 'true');
  localStorage.setItem('NEXT_PUBLIC_MOCK_AUTH', 'true');
  localStorage.setItem('NEXT_PUBLIC_AUTH_BYPASS', 'true');
  
  // OpenAI
  localStorage.setItem('OPENAI_MODEL_GPT_VISION', 'gpt-4o');
  localStorage.setItem('OPENAI_MODEL_GPT_TEXT', 'gpt-4o');
  localStorage.setItem('NEXT_PUBLIC_APP_ENV', 'development');
  
  console.log('Environment variables set in localStorage. Refresh the page to apply.');
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  window.setupEnvironment = setupEnvironment;
} else if (typeof module !== 'undefined') {
  module.exports = { setupEnvironment };
}

// Instructions:
// 1. Run this script once when starting the application
// 2. In browser console: setupEnvironment()
// 3. Refresh the page 