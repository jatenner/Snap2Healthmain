#!/usr/bin/env node

/**
 * clean-start.js
 * 
 * A script to start the app with a clean environment:
 * 1. Kill all processes on port 3000
 * 2. Clean build cache
 * 3. Start the server in a reliable way
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { exit } = require('process');

console.log('🚀 Starting Snap2Health with a clean environment...');

// Function to run a command and handle errors
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      console.log(`Running: ${command}`);
    }
    
    execSync(command, { 
      stdio: silent ? 'ignore' : 'inherit',
      env: { ...process.env }
    });
    return true;
  } catch (error) {
    if (!silent) {
      console.error(`❌ Error running command: ${command}`);
      console.error(error.message);
    }
    return false;
  }
}

// Function to clean build cache
function cleanBuildCache() {
  console.log('🧹 Cleaning build cache...');
  
  // Remove .next directory
  const nextDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ .next directory removed');
    } catch (error) {
      console.error('❌ Failed to remove .next directory:', error.message);
    }
  }
  
  // Remove node_modules/.cache directory
  const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ node_modules/.cache directory removed');
    } catch (error) {
      console.error('❌ Failed to remove node_modules/.cache directory:', error.message);
    }
  }
}

// Main function
async function main() {
  // Step 1: Kill all processes on port 3000
  console.log('🔪 Killing any processes using port 3000...');
  runCommand('node scripts/kill-ports.js', true);
  
  // Step 2: Clean build cache
  cleanBuildCache();
  
  // Step 3: Start the server using our reliable script
  console.log('🚀 Starting the server...');
  runCommand('node scripts/start-clean-server.js');
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  exit(1);
});

// Run the main function
main().catch(error => {
  console.error('❌ Error in main process:', error);
  exit(1);
}); 