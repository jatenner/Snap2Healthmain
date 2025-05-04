const fs = require('fs');
const path = require('path');

console.log('Running pre-deployment checks...');

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY'
];

const envLocalPath = path.join(process.cwd(), '.env.local');
let envFileContent = '';

try {
  envFileContent = fs.readFileSync(envLocalPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  process.exit(1);
}

let allVarsFound = true;
for (const envVar of requiredEnvVars) {
  if (!envFileContent.includes(envVar + '=')) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    allVarsFound = false;
  }
}

// Check for correct auth settings
if (envFileContent.includes('NEXT_PUBLIC_AUTH_BYPASS=true')) {
  console.warn('⚠️ Warning: AUTH_BYPASS is set to true in .env.local. This should be false for production.');
  console.log('Automatically fixing AUTH_BYPASS for production...');
  envFileContent = envFileContent.replace('NEXT_PUBLIC_AUTH_BYPASS=true', 'NEXT_PUBLIC_AUTH_BYPASS=false');
  fs.writeFileSync(envLocalPath, envFileContent);
}

if (envFileContent.includes('NEXT_PUBLIC_MOCK_AUTH=true')) {
  console.warn('⚠️ Warning: MOCK_AUTH is set to true in .env.local. This should be false for production.');
  console.log('Automatically fixing MOCK_AUTH for production...');
  envFileContent = envFileContent.replace('NEXT_PUBLIC_MOCK_AUTH=true', 'NEXT_PUBLIC_MOCK_AUTH=false');
  fs.writeFileSync(envLocalPath, envFileContent);
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (allVarsFound) {
  console.log('✅ All required environment variables found.');
  console.log('✅ Pre-deployment checks completed successfully.');
} else {
  console.error('❌ Some required environment variables are missing. Please fix before deploying.');
  process.exit(1);
} 