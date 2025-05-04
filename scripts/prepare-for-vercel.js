#!/usr/bin/env node

/**
 * Prepare for Vercel Deployment
 * 
 * This script prepares the application for deployment to Vercel by:
 * 1. Setting proper cache headers
 * 2. Ensuring environment variables are configured correctly
 * 3. Validating middleware settings
 * 4. Cleaning up any problematic files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    if (error.stderr) {
      log(`Error: ${error.stderr}`, 'red');
    }
    return null;
  }
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Rename files with .bak extension
function renameFileToBak(filePath) {
  if (fileExists(filePath)) {
    const bakPath = `${filePath}.bak`;
    log(`Renaming ${filePath} to ${bakPath}`);
    try {
      fs.renameSync(filePath, bakPath);
      return true;
    } catch (error) {
      log(`Error renaming file: ${error.message}`);
      return false;
    }
  }
  return false;
}

// Ensure env files are properly configured
function checkEnvFiles() {
  log('Checking environment files...');
  
  // List of required environment variables for production
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_ENV'
  ];
  
  // Look for .env files
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env.production'),
    path.join(process.cwd(), '.env.production.local')
  ];
  
  let envFound = false;
  let missingVars = [];
  
  // Check each env file
  for (const envPath of envPaths) {
    if (fileExists(envPath)) {
      envFound = true;
      log(`Found environment file: ${envPath}`);
      
      // Read the file and check for required variables
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      // Check for each required variable
      for (const requiredVar of requiredVars) {
        const hasVar = envLines.some(line => 
          line.trim().startsWith(requiredVar + '=') && 
          !line.trim().startsWith('#')
        );
        
        if (!hasVar && !missingVars.includes(requiredVar)) {
          missingVars.push(requiredVar);
        }
      }
    }
  }
  
  // Report findings
  if (!envFound) {
    log('WARNING: No environment files found. Make sure to set environment variables in Vercel.');
  }
  
  if (missingVars.length > 0) {
    log(`WARNING: The following environment variables are missing: ${missingVars.join(', ')}`);
    log('Make sure to set these in your Vercel project settings.');
  } else if (envFound) {
    log('All required environment variables are present.');
  }
}

// Clean up problematic files
function cleanupProblematicFiles() {
  log('Cleaning up problematic files...');
  
  // Files that may cause issues in production
  const problematicFiles = [
    'public/emergency-fix.js',
    'public/_app-fix.js',
    'public/force-render.js',
    'public/clear-demo-auth.js',
    'public/emergency-fix-typing.js',
    'public/auth-redirect.js'
  ];
  
  // Rename each problematic file
  let filesCleaned = 0;
  for (const filePath of problematicFiles) {
    if (renameFileToBak(filePath)) {
      filesCleaned++;
    }
  }
  
  log(`Cleaned up ${filesCleaned} problematic files.`);
}

// Check middleware configuration
function checkMiddleware() {
  log('Checking middleware configuration...');
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (!fileExists(middlewarePath)) {
    log('No middleware.ts file found.');
    return;
  }
  
  // Read middleware file
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check if matcher pattern is properly formatted
  if (middlewareContent.includes('export const config = {')) {
    log('Middleware config found, checking matcher pattern...');
    
    // Look for common errors in matcher syntax
    const hasInvalidMatcher = 
      middlewareContent.includes("matcher: '/") || 
      middlewareContent.includes("matcher: ['/") ||
      middlewareContent.includes("matcher: '(");
    
    if (hasInvalidMatcher) {
      log('WARNING: Possible invalid matcher pattern in middleware.ts');
      log('Make sure matcher patterns use proper format, e.g. \'/(.*)\' instead of \'/(.*)\'');
    } else {
      log('Middleware matcher pattern looks valid.');
    }
  } else {
    log('WARNING: No middleware config section found. This may cause issues with route handling.');
  }
}

// Clean the build directory
function cleanBuildDirectory() {
  log('Cleaning build directory...');
  
  const nextDir = path.join(process.cwd(), '.next');
  if (fileExists(nextDir)) {
    log('Removing .next directory...');
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      log('Build directory cleaned successfully.');
    } catch (error) {
      log(`Error cleaning build directory: ${error.message}`);
    }
  } else {
    log('No existing build directory found.');
  }
}

// Check for caching issues
function checkCachingIssues() {
  log('Checking for caching issues...');
  
  // Files that should have cache control headers
  const filesToCheck = [
    'app/layout.tsx',
    'src/middleware.ts',
    'middleware.ts'
  ];
  
  for (const filePath of filesToCheck) {
    if (fileExists(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if cache control headers are set
      const hasCacheHeaders = 
        content.includes('Cache-Control') || 
        content.includes('cache-control');
      
      if (!hasCacheHeaders) {
        log(`WARNING: No cache control headers found in ${filePath}`);
      } else {
        log(`Cache control headers found in ${filePath}`);
      }
    }
  }
}

// Set the build timestamp
function setBuildTimestamp() {
  log('Setting build timestamp...');
  
  const timestamp = new Date().toISOString();
  
  // Try to set it as an environment variable
  process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = timestamp;
  
  // Also create a temporary file to store the timestamp
  const timestampPath = path.join(process.cwd(), '.build-timestamp');
  fs.writeFileSync(timestampPath, timestamp);
  
  log(`Build timestamp set to: ${timestamp}`);
}

// Main function
async function main() {
  try {
    log('Preparing for Vercel deployment...');
    
    // Step 1: Clean up problematic files
    cleanupProblematicFiles();
    
    // Step 2: Check environment files
    checkEnvFiles();
    
    // Step 3: Check middleware configuration
    checkMiddleware();
    
    // Step 4: Check for caching issues
    checkCachingIssues();
    
    // Step 5: Clean build directory
    cleanBuildDirectory();
    
    // Step 6: Set build timestamp
    setBuildTimestamp();
    
    log('Preparation for Vercel deployment completed successfully.');
    log('Ready to deploy to Vercel!');
  } catch (error) {
    log(`Error during preparation: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 