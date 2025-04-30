// Simple script to check environment variable loading
require('dotenv').config({ path: '.env.local' });

console.log('Environment check:');
console.log('============================');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Print first few characters if it exists (don't print the whole key for security)
if (process.env.OPENAI_API_KEY) {
  const key = process.env.OPENAI_API_KEY;
  console.log('OPENAI_API_KEY starts with:', key.substring(0, 7) + '...');
  console.log('OPENAI_API_KEY length:', key.length);
  console.log('Contains "sk-your-openai-key":', key.includes('sk-your-openai-key'));
}

console.log('============================');
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('============================');
console.log('NODE_ENV:', process.env.NODE_ENV); 