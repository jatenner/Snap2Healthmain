const fs = require('fs');
const path = require('path');

// Define paths
const cwd = process.cwd();
const envLocalPath = path.join(cwd, '.env.local');
const envProductionPath = path.join(cwd, '.env.production');

// Create public/uploads directory if it doesn't exist
const uploadsDir = path.join(cwd, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating public/uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copy .env.local to .env.production if it doesn't exist
if (fs.existsSync(envLocalPath) && !fs.existsSync(envProductionPath)) {
  console.log('Creating .env.production from .env.local...');
  
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Replace development values with production values
  const envProductionContent = envLocalContent
    .replace(/NEXT_PUBLIC_APP_ENV=development/g, 'NEXT_PUBLIC_APP_ENV=production')
    .replace(/NEXT_PUBLIC_MOCK_AUTH=true/g, 'NEXT_PUBLIC_MOCK_AUTH=false')
    .replace(/NEXT_PUBLIC_AUTH_BYPASS=true/g, 'NEXT_PUBLIC_AUTH_BYPASS=false');
  
  fs.writeFileSync(envProductionPath, envProductionContent);
  console.log('.env.production file created successfully.');
}

console.log('Preparation for Vercel deployment completed.'); 