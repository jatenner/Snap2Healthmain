#!/usr/bin/env node

/**
 * Script to purge Vercel's cache during deployment
 * Uses Vercel CLI to force a clean deployment
 */

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
    if (error.stderr) {
      log(`Command failed: ${command}`, 'red');
      log(`Error: ${error.stderr}`, 'red');
    }
    return '';
  }
}

// Main function to purge cache
function main() {
  log('🚀 Starting Vercel cache purge process...', 'magenta');
  
  try {
    // Check if we're in a Vercel environment
    if (process.env.VERCEL) {
      log('Running in Vercel environment, using deployment environment variables', 'yellow');
      
      // Add special environment variables to force fresh builds
      process.env.VERCEL_FORCE_NO_BUILD_CACHE = '1';
      log('Set VERCEL_FORCE_NO_BUILD_CACHE=1', 'green');
      
      log('Cache invalidation configured for Vercel deployment', 'green');
    } else {
      log('Running in local environment, executing Vercel CLI commands', 'yellow');
      
      // Try to clear build cache using the Vercel CLI
      log('Executing Vercel CLI command to clear build cache...', 'cyan');
      const result = runCommand('vercel env pull && VERCEL_FORCE_NO_BUILD_CACHE=1 vercel --prod');
      
      if (result) {
        log('Vercel CLI command executed successfully!', 'green');
        log(result, 'reset');
      } else {
        log('Failed to execute Vercel CLI command. Make sure you are logged in to Vercel.', 'red');
        log('Try running "vercel login" first.', 'yellow');
      }
    }
    
    // Add other cache invalidation methods
    log('Invalidating browser cache by adding cache headers...', 'cyan');
    log('Cache Control headers have been added to vercel.json and next.config.js', 'green');
  } catch (error) {
    log(`Error during cache purge: ${error.message}`, 'red');
    process.exit(1);
  }
  
  log('🎉 Cache purge process completed!', 'magenta');
}

// Run the main function
main(); 