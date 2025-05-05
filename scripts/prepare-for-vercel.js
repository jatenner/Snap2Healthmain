#!/usr/bin/env node

/**
 * Vercel Deployment Preparation Script
 * 
 * This script prepares the codebase for deployment to Vercel, focusing on:
 * 1. Ensuring auth-client-fix.js is properly installed and up to date
 * 2. Checking that all required environment variables are set
 * 3. Validating the existence of critical files
 * 4. Setting up any additional configuration needed for Vercel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define critical paths
const authFixPath = path.join(process.cwd(), 'public', 'auth-client-fix.js');
const layoutPath = path.join(process.cwd(), 'app', 'layout.jsx');
const supbaseSingletonPath = path.join(process.cwd(), 'src', 'lib', 'supabase-singleton.js');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');

console.log('🔧 Preparing project for Vercel deployment...');

// Set environment variable for build time
process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = new Date().toISOString();
process.env.NEXT_PUBLIC_AUTH_FIX_VERSION = '4';
console.log(`✅ Set build timestamp: ${process.env.NEXT_PUBLIC_BUILD_TIMESTAMP}`);

// Check if auth-client-fix.js exists and is v4
try {
  const authFixExists = fs.existsSync(authFixPath);
  if (!authFixExists) {
    console.error('❌ auth-client-fix.js not found! This is required for proper authentication.');
    process.exit(1);
  }
  
  const authFixContent = fs.readFileSync(authFixPath, 'utf8');
  if (!authFixContent.includes('authClientFixVersion = 4')) {
    console.warn('⚠️ auth-client-fix.js is not v4. Auth issues may occur.');
  } else {
    console.log('✅ auth-client-fix.js v4 found');
  }
} catch (error) {
  console.error('❌ Error checking auth-client-fix.js:', error);
  process.exit(1);
}

// Check if layout.jsx is properly configured
try {
  const layoutExists = fs.existsSync(layoutPath);
  if (!layoutExists) {
    console.error('❌ app/layout.jsx not found! This is required for proper page layout.');
    process.exit(1);
  }
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (!layoutContent.includes('auth-fix-version" content="4"')) {
    console.warn('⚠️ app/layout.jsx is not configured for auth-client-fix v4.');
  } else {
    console.log('✅ app/layout.jsx properly configured');
  }
} catch (error) {
  console.error('❌ Error checking app/layout.jsx:', error);
  process.exit(1);
}

// Check if supabase-singleton.js is properly configured
try {
  const singletonExists = fs.existsSync(supbaseSingletonPath);
  if (!singletonExists) {
    console.error('❌ src/lib/supabase-singleton.js not found! This is required for proper authentication.');
    process.exit(1);
  }
  
  const singletonContent = fs.readFileSync(supbaseSingletonPath, 'utf8');
  if (!singletonContent.includes('__supabaseSingletonVersion = 4')) {
    console.warn('⚠️ supabase-singleton.js is not v4. Auth issues may occur.');
  } else {
    console.log('✅ supabase-singleton.js v4 found');
  }
} catch (error) {
  console.error('❌ Error checking supabase-singleton.js:', error);
  process.exit(1);
}

// Check that next.config.js doesn't have static export
try {
  const nextConfigExists = fs.existsSync(nextConfigPath);
  if (!nextConfigExists) {
    console.error('❌ next.config.js not found!');
    process.exit(1);
  }
  
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  if (nextConfigContent.includes('output: "export"')) {
    console.error('❌ next.config.js contains static export setting which conflicts with API routes!');
    console.log('   Remove or comment out the "output: "export"" line.');
    process.exit(1);
  } else {
    console.log('✅ next.config.js properly configured');
  }
} catch (error) {
  console.error('❌ Error checking next.config.js:', error);
  process.exit(1);
}

// Validate essential environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables that may be needed for production:');
  console.warn('   ' + missingEnvVars.join(', '));
  console.warn('   Make sure these are set in your Vercel project settings!');
} else {
  console.log('✅ All required environment variables found');
}

// Ensure important directories exist
const importantDirs = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'app', 'api'),
  path.join(process.cwd(), 'src', 'lib'),
];

for (const dir of importantDirs) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }
}

// Final success message
console.log('✅ Project prepared for Vercel deployment');
console.log('   Run "npm run deploy:vercel-fix-auth" to deploy with auth fixes'); 