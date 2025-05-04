require('dotenv').config({ path: '.env.local' });

console.log('Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Not set ❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✅' : 'Not set ❌');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Not set ❌');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('NEXT_PUBLIC_APP_ENV:', process.env.NEXT_PUBLIC_APP_ENV);
console.log('NEXT_PUBLIC_AUTH_BYPASS:', process.env.NEXT_PUBLIC_AUTH_BYPASS); 