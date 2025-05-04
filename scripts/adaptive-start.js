#!/usr/bin/env node

/**
 * Adaptive Server Startup Script
 * 
 * This script automatically detects your system's available memory
 * and starts the appropriate server configuration to prevent memory issues.
 */

const { execSync, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Configure thresholds (in GB)
const HIGH_MEMORY_THRESHOLD = 6.0;  // 6GB or more available
const MEDIUM_MEMORY_THRESHOLD = 3.0; // 3GB or more available
const LOW_MEMORY_THRESHOLD = 1.5;    // 1.5GB or more available

// Log function with timestamps
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Function to clean up any existing processes
function cleanupProcesses() {
  log('Cleaning up any existing processes...');
  try {
    // Kill any processes using port 3000
    const killPortsScript = path.join(__dirname, 'kill-ports-improved.js');
    if (fs.existsSync(killPortsScript)) {
      execSync(`node ${killPortsScript} --force`, { stdio: 'ignore' });
    } else {
      // Fallback to direct kill (platform-specific)
      if (process.platform === 'win32') {
        execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
      } else {
        execSync('pkill -f "node.*3000" || true', { stdio: 'ignore' });
      }
    }
  } catch (error) {
    // Ignore errors as processes might not be running
  }
}

// Function to clean build cache
function cleanBuildCache() {
  log('Cleaning build cache...');
  try {
    // Remove .next and node_modules/.cache
    execSync('rm -rf .next node_modules/.cache', { stdio: 'ignore' });
  } catch (error) {
    log(`Error cleaning cache: ${error.message}`);
  }
}

// Function to get available system memory in GB
function getAvailableMemory() {
  const totalMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
  let freeMemoryGB = os.freemem() / 1024 / 1024 / 1024;
  
  // On some systems like macOS, additional memory check can be helpful
  try {
    if (process.platform === 'darwin') {
      const vmStatOutput = execSync('vm_stat').toString();
      const pageSize = 4096; // Default page size on macOS in bytes
      const lines = vmStatOutput.split('\n');
      
      let freePages = 0;
      for (const line of lines) {
        if (line.includes('Pages free')) {
          const match = line.match(/Pages free:\s+(\d+)/);
          if (match && match[1]) {
            freePages += parseInt(match[1], 10);
          }
        }
        if (line.includes('Pages inactive')) {
          const match = line.match(/Pages inactive:\s+(\d+)/);
          if (match && match[1]) {
            freePages += parseInt(match[1], 10) * 0.5; // Count inactive pages as half available
          }
        }
      }
      
      const macOSFreeMemoryGB = (freePages * pageSize) / 1024 / 1024 / 1024;
      // Use the lower value for a more conservative estimate
      freeMemoryGB = Math.min(freeMemoryGB, macOSFreeMemoryGB);
    }
  } catch (error) {
    // Fallback to standard method if the macOS specific check fails
  }
  
  return {
    totalGB: totalMemoryGB,
    freeGB: freeMemoryGB
  };
}

// Function to start the server with the appropriate configuration
function startServer() {
  // Check available memory
  const memory = getAvailableMemory();
  log(`System memory: ${memory.totalGB.toFixed(1)}GB total, ${memory.freeGB.toFixed(1)}GB available`);
  
  // Clean up processes and cache first
  cleanupProcesses();
  cleanBuildCache();
  
  let command = '';
  
  // Choose the appropriate server configuration based on available memory
  if (memory.freeGB >= HIGH_MEMORY_THRESHOLD) {
    log('High memory available. Using standard configuration.');
    command = 'npm run dev';
  } else if (memory.freeGB >= MEDIUM_MEMORY_THRESHOLD) {
    log('Medium memory available. Using optimized configuration.');
    command = 'npm run dev:light';
  } else if (memory.freeGB >= LOW_MEMORY_THRESHOLD) {
    log('Limited memory available. Using lightweight configuration.');
    command = 'npm run dev:stable';
  } else {
    log('Low memory detected. Using ultra-lightweight configuration.');
    command = 'npm run dev:ultra-light';
  }
  
  // Start the chosen server configuration
  log(`Starting with command: ${command}`);
  
  // Spawn the process and pipe output
  const proc = spawn(command, { 
    shell: true, 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Set memory limits based on available memory
      NODE_OPTIONS: `--max-old-space-size=${Math.floor(memory.freeGB * 1024)} --max-semi-space-size=16 --expose-gc`
    }
  });
  
  // Handle process exit
  proc.on('exit', (code) => {
    if (code !== 0) {
      log(`Error: Server exited with code ${code}`);
      
      // If server crashed due to memory issues, try again with a more lightweight configuration
      if (code === 137 || code === 9) { // SIGKILL or "Killed: 9"
        log('Server was killed due to memory issues. Retrying with ultra-lightweight configuration...');
        
        // Force ultra-lightweight mode
        const ultraLightProc = spawn('npm run dev:ultra-light', {
          shell: true,
          stdio: 'inherit'
        });
        
        ultraLightProc.on('exit', (ultraLightCode) => {
          if (ultraLightCode !== 0) {
            log(`Error: Ultra-lightweight server exited with code ${ultraLightCode}`);
            process.exit(ultraLightCode);
          }
        });
      } else {
        process.exit(code);
      }
    }
  });
  
  // Handle errors
  proc.on('error', (error) => {
    log(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Start the server
startServer(); 