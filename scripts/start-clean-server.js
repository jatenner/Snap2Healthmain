#!/usr/bin/env node

/**
 * Start Clean Server Script
 * 
 * This script ensures that:
 * 1. All processes using port 3000 are terminated
 * 2. Build cache is cleaned
 * 3. Server starts with proper environment variables
 */

const { execSync, spawn } = require('child_process');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Configuration
const PORT = 3000;
const DEFAULT_ENV = 'development';

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${message}`);
}

// Run a command and return its output
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      log(`Running: ${command}`);
    }
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    if (!silent) {
      log(`Command failed: ${command}`);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
    }
    return null;
  }
}

// Check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Free port by killing processes using it
async function freePort(port) {
  log(`Checking if port ${port} is in use...`);
  
  const inUse = await isPortInUse(port);
  if (!inUse) {
    log(`Port ${port} is already free.`);
    return true;
  }
  
  log(`Port ${port} is in use. Attempting to free it...`);
  
  let success = false;
  
  // Try OS-specific commands to kill processes
  if (process.platform === 'win32') {
    // Windows
    try {
      runCommand(`netstat -ano | findstr :${port}`, true);
      runCommand(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`, true);
      success = true;
    } catch (err) {
      // Try PowerShell as fallback
      try {
        runCommand(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force"`, true);
        success = true;
      } catch (error) {
        log(`Failed to free port ${port} on Windows.`);
      }
    }
  } else {
    // macOS/Linux
    try {
      runCommand(`lsof -ti:${port} | xargs kill -9`, true);
      success = true;
    } catch (err) {
      // Try another approach
      try {
        runCommand(`pkill -f "node.*:${port}"`, true);
        success = true;
      } catch (error) {
        log(`Failed to free port ${port} on Unix.`);
      }
    }
  }
  
  // Verify port is now free
  const stillInUse = await isPortInUse(port);
  if (stillInUse) {
    log(`Port ${port} could not be freed. Please close any applications using it manually.`);
    return false;
  }
  
  log(`Successfully freed port ${port}.`);
  return true;
}

// Clean build cache
function cleanBuildCache() {
  log('Cleaning build cache...');
  
  // Remove .next directory
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    log('Removing .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
  
  // Clear node_modules/.cache
  const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    log('Clearing node_modules/.cache...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  
  log('Build cache cleaned.');
  return true;
}

// Start server
function startServer() {
  log('Starting Next.js development server...');
  
  // Set environment variables
  process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = Date.now().toString();
  
  // Start the dev server
  const nextProcess = spawn('next', ['dev'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  
  // Handle process events
  nextProcess.on('error', (error) => {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
  
  nextProcess.on('close', (code) => {
    if (code !== 0) {
      log(`Server process exited with code ${code}`);
    }
  });
  
  // We won't wait for this process to finish
  log('Server process started.');
}

// Main function
async function main() {
  try {
    log('Starting clean server process...');
    
    // Step 1: Free the port
    const portFreed = await freePort(PORT);
    if (!portFreed) {
      log('WARNING: Could not free port. Server may fail to start.');
    }
    
    // Step 2: Clean the build cache
    cleanBuildCache();
    
    // Step 3: Load environment variables
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      log('Loading environment variables from .env.local');
      dotenv.config({ path: envPath });
    }
    
    // Set default environment
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = DEFAULT_ENV;
    }
    
    // Step 4: Start the server
    startServer();
    
    log('Clean server process completed. Server should be starting now.');
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main(); 