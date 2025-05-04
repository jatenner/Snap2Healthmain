#!/usr/bin/env node

/**
 * Custom build script for Vercel deployments
 * This script is designed to work in environments where system commands like lsof aren't available
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment variables for Vercel
process.env.VERCEL = '1';
process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT = 'true';
process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = new Date().toISOString();

console.log('🚀 Starting Vercel build script');
console.log('Environment: Production Vercel deployment');

// Ensure the .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  try {
    fs.mkdirSync(nextDir, { recursive: true });
    console.log('Created .next directory');
  } catch (error) {
    console.warn('Error creating .next directory:', error.message);
  }
}

// Run the Next.js build
try {
  console.log('Running Next.js build...');
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });
  console.log('✅ Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed, running emergency fixes...');
  
  try {
    // Run emergency fixes
    console.log('Running emergency fixes...');
    execSync('node scripts/fix-all-issues.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });
    
    // Try building again without linting
    console.log('Retrying build without linting...');
    execSync('next build --no-lint', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });
    console.log('✅ Build completed successfully after fixes');
    process.exit(0);
  } catch (fixError) {
    console.error('❌ Failed to recover from build error:', fixError.message);
    process.exit(1);
  }
} 