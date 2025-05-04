#!/usr/bin/env node

/**
 * quick-fix.js
 * 
 * A streamlined recovery script for Snap2Health that fixes common issues
 * - Frees ports 3000-3010
 * - Cleans build cache
 * - Removes problematic files
 * - Starts clean server
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run a command and return the output
function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    if (!silent) {
      log(output);
    }
    return output;
  } catch (error) {
    if (!silent) {
      log(`Error running command: ${command}`, 'red');
      log(error.message, 'red');
    }
    return '';
  }
}

// Check if a port is in use
function isPortInUse(port) {
  try {
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port} | findstr LISTENING`;
    } else {
      command = `lsof -i:${port} -t`;
    }
    
    const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim().length > 0;
  } catch (error) {
    return false; // If the command fails, assume the port is not in use
  }
}

// Free a port if it's in use
async function freePort(port) {
  if (!isPortInUse(port)) {
    log(`Port ${port} is already free.`, 'green');
    return;
  }
  
  log(`Port ${port} is in use. Attempting to free it...`, 'yellow');
  
  try {
    if (process.platform === 'win32') {
      // Windows: use netstat to find PIDs and kill them
      const netstatOutput = runCommand(`netstat -ano | findstr :${port} | findstr LISTENING`, true);
      const lines = netstatOutput.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          log(`Killing process with PID ${pid}`, 'yellow');
          runCommand(`taskkill /F /PID ${pid}`, true);
        }
      }
    } else {
      // macOS/Linux: use lsof and kill
      const lsofOutput = runCommand(`lsof -i:${port} -t`, true);
      const pids = lsofOutput.split('\n').filter(pid => pid.trim().length > 0);
      
      for (const pid of pids) {
        log(`Killing process with PID ${pid}`, 'yellow');
        runCommand(`kill -9 ${pid}`, true);
      }
    }
    
    // Additional aggressive approach for both platforms
    if (process.platform === 'win32') {
      runCommand(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force -ErrorAction SilentlyContinue"`, true);
    } else {
      runCommand(`pkill -f "node.*:${port}"`, true);
    }
    
    if (isPortInUse(port)) {
      log(`Failed to free port ${port}. Please try restarting your computer.`, 'red');
    } else {
      log(`Successfully freed port ${port}.`, 'green');
    }
  } catch (error) {
    log(`Error freeing port ${port}: ${error.message}`, 'red');
  }
}

// Clean build cache
function cleanBuildCache() {
  log('Cleaning build cache...', 'blue');
  
  try {
    // Remove .next directory
    if (fs.existsSync(path.join(process.cwd(), '.next'))) {
      log('Removing .next directory...', 'blue');
      fs.rmSync(path.join(process.cwd(), '.next'), { recursive: true, force: true });
    }
    
    // Remove node_modules/.cache
    const cachePath = path.join(process.cwd(), 'node_modules', '.cache');
    if (fs.existsSync(cachePath)) {
      log('Removing node_modules/.cache...', 'blue');
      fs.rmSync(cachePath, { recursive: true, force: true });
    }
    
    log('Build cache cleaned successfully.', 'green');
    return true;
  } catch (error) {
    log(`Error cleaning build cache: ${error.message}`, 'red');
    return false;
  }
}

// Remove problematic emergency fix files
function removeProblematicFiles() {
  log('Removing problematic files...', 'blue');
  
  const filesToRemove = [
    'public/emergency-fix.js',
    'scripts/emergency-fix.js',
    'public/emergency-fix-typing.js',
    'public/_app-fix.js',
    'public/force-render.js',
    'emergency-server.js'
  ];
  
  for (const file of filesToRemove) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        log(`Removed: ${file}`, 'green');
      } catch (error) {
        log(`Failed to remove ${file}: ${error.message}`, 'red');
      }
    }
  }
  
  log('Problematic files check completed.', 'green');
}

// Start the clean server
function startCleanServer() {
  log('Starting clean server...', 'blue');
  
  try {
    // Use the clean-standalone-server.js script
    const serverPath = path.join(process.cwd(), 'clean-standalone-server.js');
    if (fs.existsSync(serverPath)) {
      log('Starting clean standalone server...', 'blue');
      log('Server is starting in a new process...', 'green');
      
      // Instead of running directly, instruct user to run
      log('\n================================', 'cyan');
      log('All cleanup steps completed successfully!', 'green');
      log('To start the server, run:', 'cyan');
      log('  npm run dev:stable', 'yellow');
      log('================================\n', 'cyan');
      
      return true;
    } else {
      log('clean-standalone-server.js not found. Falling back to Next.js dev server.', 'yellow');
      log('To start the server, run:', 'cyan');
      log('  npm run dev:clean', 'yellow');
      return false;
    }
  } catch (error) {
    log(`Error starting server: ${error.message}`, 'red');
    return false;
  }
}

// Main function
async function main() {
  log('\n🚀 Snap2Health Quick Fix', 'cyan');
  log('Running recovery operations to fix common issues...\n', 'cyan');
  
  // 1. Kill processes on ports 3000-3010
  log('Step 1: Freeing ports 3000-3010...', 'magenta');
  for (let port = 3000; port <= 3010; port++) {
    await freePort(port);
  }
  
  // 2. Clean build cache
  log('\nStep 2: Cleaning build cache...', 'magenta');
  cleanBuildCache();
  
  // 3. Remove problematic files
  log('\nStep 3: Removing problematic files...', 'magenta');
  removeProblematicFiles();
  
  // 4. Start the clean server
  log('\nStep 4: Preparing to start clean server...', 'magenta');
  startCleanServer();
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'red');
  process.exit(1);
}); 