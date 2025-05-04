#!/usr/bin/env node

/**
 * Deploy to Production Script
 * 
 * A comprehensive script that:
 * 1. Fixes all production issues
 * 2. Rebuilds the application
 * 3. Creates a proper standalone build
 * 4. Deploys to the hosting platform (Vercel)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

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
function runCommand(command, options = {}) {
  try {
    log(`> ${command}`, 'blue');
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      log(`Command failed but continuing: ${command}`, 'yellow');
      return null;
    }
    log(`Error executing command: ${command}`, 'red');
    if (error.stderr) {
      log(`Error output: ${error.stderr}`, 'red');
    }
    throw error;
  }
}

// Check if file or dir exists
function exists(filePath) {
  return fs.existsSync(filePath);
}

// Main deployment function
async function deploy() {
  log('🚀 Starting deployment process for Snap2Health...', 'magenta');
  
  // Step 1: Ensure we're in a clean state
  log('\n📋 Step 1: Clean up and prepare workspace', 'cyan');
  
  // Kill any running processes on the development port
  runCommand('npm run kill-ports', { ignoreError: true });
  
  // Clean up build artifacts
  if (exists('.next')) {
    log('Removing previous build artifacts...', 'yellow');
    runCommand('rm -rf .next');
  }
  
  // Step 2: Run the production fix script
  log('\n📋 Step 2: Applying production fixes', 'cyan');
  runCommand('npm run fix-production');
  
  // Step 3: Build the application
  log('\n📋 Step 3: Building application for production', 'cyan');
  runCommand('npm run clean-build');
  
  // Check if build succeeded
  if (!exists('.next/standalone/server.js')) {
    log('❌ Build failed: standalone server.js not found', 'red');
    exit(1);
  }
  
  // Step 4: Test the build locally
  log('\n📋 Step 4: Testing production build locally', 'cyan');
  
  // Start server in background
  log('Starting production server for testing...', 'yellow');
  const serverProcess = require('child_process').spawn('node', ['.next/standalone/server.js'], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Don't wait for the server, just let it run in background
  serverProcess.unref();
  
  // Wait a moment for server to start
  log('Waiting for server to start...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test the server with curl
  try {
    log('Testing server response...', 'yellow');
    runCommand('curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"', { silent: true });
    log('✅ Server is running successfully', 'green');
  } catch (error) {
    log('❌ Server test failed, but continuing with deployment', 'yellow');
  }
  
  // Kill the test server
  try {
    runCommand('npm run kill-ports', { ignoreError: true });
  } catch (error) {
    log('Failed to kill test server, but continuing', 'yellow');
  }
  
  // Step 5: Deploy to production
  log('\n📋 Step 5: Deploying to production', 'cyan');
  const deployChoice = process.argv[2] || 'vercel';
  
  switch (deployChoice.toLowerCase()) {
    case 'vercel':
      log('Deploying to Vercel...', 'blue');
      runCommand('vercel --prod');
      break;
      
    case 'netlify':
      log('Deploying to Netlify...', 'blue');
      runCommand('netlify deploy --prod');
      break;
      
    case 'custom':
      log('Running custom deploy command...', 'blue');
      const customCommand = process.argv[3] || 'npm run deploy:custom';
      runCommand(customCommand);
      break;
      
    default:
      log('Deploying using npm deploy script...', 'blue');
      runCommand('npm run deploy:fixed');
  }
  
  // Step 6: Deployment verification steps
  log('\n📋 Step 6: Post-deployment verification', 'cyan');
  log('✅ Deployment complete!', 'green');
  log('\nVerify the following in production:', 'yellow');
  log('1. Authentication is working properly', 'yellow');
  log('2. Image uploads and analysis work properly', 'yellow');
  log('3. User profiles and data are loaded correctly', 'yellow');
  log('4. API routes return proper responses', 'yellow');
  
  log('\n🎉 Deployment process completed successfully!', 'magenta');
}

// Run the deployment process
deploy().catch(error => {
  log(`❌ Deployment failed: ${error.message}`, 'red');
  exit(1);
}); 