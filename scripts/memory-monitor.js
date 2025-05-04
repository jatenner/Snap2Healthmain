#!/usr/bin/env node

/**
 * Memory Monitoring Tool for Snap2Health
 * 
 * This script monitors memory usage of the Next.js server process
 * and kills it if it exceeds defined thresholds to prevent system crashes.
 * 
 * Usage:
 *   node scripts/memory-monitor.js [process-id] [--auto]
 * 
 * If no process ID is provided and --auto is used, it will find Next.js processes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_MEMORY_MB = 3000; // Maximum allowed memory usage in MB (lowered from 3500)
const CHECK_INTERVAL = 15000; // Check every 15 seconds
const LOG_FILE = path.join(__dirname, '..', 'memory-monitor.log');
const AUTO_RESTART_SCRIPT = 'npm run dev:clean'; // Changed from dev:stable to dev:clean for lighter restart

// Log to file and console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error('Could not write to log file:', err.message);
  }
}

// Find Next.js server processes
function findNextProcesses() {
  try {
    let processIds = [];
    
    if (process.platform === 'win32') {
      // Windows
      const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV').toString();
      const lines = output.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Parse CSV format
          const parts = line.split(',');
          if (parts.length > 2) {
            const pid = parts[1].replace(/"/g, '');
            processIds.push({ pid, memory: 0 });
          }
        }
      }
    } else {
      // macOS/Linux - Modified to use a more reliable command
      try {
        // First try with ps aux and grep for specific process patterns
        const output = execSync('ps aux | grep -E "[n]ode.*next|[n]ode.*clean-standalone"').toString();
        const lines = output.split('\n');
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 1) {
            const pid = parts[1];
            let memoryEstimate = 0;
            
            // Try to get memory % from ps output (column 3)
            if (parts.length > 3) {
              memoryEstimate = parseFloat(parts[3]);
            }
            
            processIds.push({ 
              pid, 
              memory: memoryEstimate,
              command: parts.slice(10).join(' ').substring(0, 30) // Include partial command for logging
            });
          }
        });
      } catch (err) {
        // Fallback to just finding node processes if the specific grep fails
        try {
          const output = execSync('ps aux | grep node | grep -v grep').toString();
          const lines = output.split('\n');
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 1) {
              const pid = parts[1];
              processIds.push({ 
                pid, 
                memory: 0,
                command: parts.slice(10).join(' ').substring(0, 30) // Include partial command for logging
              });
            }
          });
        } catch (innerErr) {
          log(`Error in fallback process search: ${innerErr.message}`);
        }
      }
    }
    
    return processIds;
  } catch (err) {
    log(`Error finding Next.js processes: ${err.message}`);
    return [];
  }
}

// Get memory usage of a process - Completely rewritten for macOS/Linux
function getProcessMemory(pid) {
  if (!pid) return 0;
  
  try {
    if (process.platform === 'win32') {
      // Windows
      const output = execSync(`wmic process where processid=${pid} get WorkingSetSize`).toString();
      const lines = output.split('\n');
      if (lines.length > 1) {
        const bytes = parseInt(lines[1].trim(), 10);
        return bytes / (1024 * 1024); // Convert to MB
      }
    } else {
      // macOS/Linux - Completely redone with multiple fallbacks
      try {
        // Method 1: Try ps with rss (most reliable on Linux)
        const output = execSync(`ps -p ${pid} -o rss=`).toString().trim();
        if (output) {
          const kb = parseInt(output, 10);
          return kb / 1024; // Convert to MB
        }
      } catch (err1) {
        try {
          // Method 2: Try ps with different format (better for macOS)
          const output = execSync(`ps -p ${pid} -o rss`).toString();
          const lines = output.split('\n');
          if (lines.length > 1) {
            const kb = parseInt(lines[1].trim(), 10);
            return kb / 1024; // Convert to MB
          }
        } catch (err2) {
          try {
            // Method 3: Try top for a single iteration (works on both macOS and Linux)
            const output = execSync(`top -pid ${pid} -l 1 -stats pid,mem -o mem`).toString();
            // Extract memory usage from top output
            const memMatch = output.match(/(\d+[A-Z])(?:\s+\+|$)/);
            if (memMatch && memMatch[1]) {
              const memText = memMatch[1];
              const value = parseFloat(memText);
              // Convert based on unit (K, M, G)
              if (memText.endsWith('K')) {
                return value / 1024;
              } else if (memText.endsWith('M')) {
                return value;
              } else if (memText.endsWith('G')) {
                return value * 1024;
              }
              return value / 1024; // Assume KB if no unit
            }
          } catch (err3) {
            log(`All memory detection methods failed for PID ${pid}`);
            return 0;
          }
        }
      }
    }
    return 0;
  } catch (err) {
    // Instead of logging every error which fills up the logs, return 0 silently
    return 0;
  }
}

// Kill a process by ID
function killProcess(pid) {
  try {
    log(`Killing process ${pid} due to excessive memory usage`);
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`);
    } else {
      execSync(`kill -9 ${pid}`);
    }
    return true;
  } catch (err) {
    log(`Error killing process ${pid}: ${err.message}`);
    return false;
  }
}

// Restart server (if in auto mode)
function restartServer() {
  try {
    log('Attempting to restart server...');
    
    // On macOS/Linux, kill all node processes first to ensure a clean restart
    if (process.platform !== 'win32') {
      try {
        execSync('pkill -9 node', { stdio: 'pipe' });
        log('Killed all node processes for clean restart');
      } catch (err) {
        // Ignore errors, some processes might not exist
      }
    }
    
    // Wait a moment for processes to fully terminate
    setTimeout(() => {
      try {
        execSync(AUTO_RESTART_SCRIPT, { stdio: 'inherit' });
        log('Server restart command executed');
      } catch (err) {
        log(`Error during restart execution: ${err.message}`);
      }
    }, 1000);
    
    return true;
  } catch (err) {
    log(`Error restarting server: ${err.message}`);
    return false;
  }
}

// Main function to monitor process
function monitorProcess(pid) {
  log(`Starting memory monitor for process ${pid}`);
  
  setInterval(() => {
    try {
      const memoryMB = getProcessMemory(pid);
      
      // Log every 5 minutes or when memory is high
      const minutes = new Date().getMinutes();
      if (minutes % 5 === 0 || memoryMB > MAX_MEMORY_MB * 0.8) {
        log(`Process ${pid} memory usage: ${memoryMB.toFixed(2)} MB`);
      }
      
      if (memoryMB > MAX_MEMORY_MB) {
        log(`WARNING: Process ${pid} exceeded memory threshold: ${memoryMB.toFixed(2)} MB`);
        if (killProcess(pid)) {
          log(`Process ${pid} was terminated to prevent system instability`);
        }
      }
    } catch (err) {
      log(`Error in monitoring cycle: ${err.message}`);
    }
  }, CHECK_INTERVAL);
}

// Function to run in auto mode with improved error handling
function runAutoMode() {
  log('Running in auto mode - searching for Next.js processes');
  
  // Initial process detection
  const processes = findNextProcesses();
  if (processes.length === 0) {
    log('No Next.js processes found to monitor');
    log('Will continue checking for new processes...');
  } else {
    // Log found processes - Limited to just a few to avoid log spam
    log(`Found ${processes.length} matching processes to monitor`);
    processes.slice(0, 3).forEach(({ pid, memory, command }) => {
      log(`Process ${pid}: ${command || 'node'} (mem: ${memory})`);
    });
  }
  
  // Track errors to prevent log spam
  let consecutiveErrors = 0;
  
  // Watch for memory issues periodically
  setInterval(() => {
    try {
      const currentProcesses = findNextProcesses();
      
      // Reset error counter when processes are found
      if (currentProcesses.length > 0) {
        consecutiveErrors = 0;
      }
      
      if (currentProcesses.length === 0) {
        // Only log and attempt restart after a few consecutive empty checks
        if (consecutiveErrors === 0) {
          log('No monitored processes found. Server might have crashed or exited.');
        }
        
        consecutiveErrors++;
        
        // Only try to restart if we've seen no processes for several checks
        if (consecutiveErrors >= 3) {
          log(`No processes found for ${consecutiveErrors} consecutive checks. Attempting restart.`);
          restartServer();
          consecutiveErrors = 0; // Reset after restart attempt
        }
        return;
      }
      
      // Process monitoring - only check a few processes to avoid log spam
      // Pick only the processes most likely to be our Next.js server
      const processesToCheck = currentProcesses
        .filter(p => p.command && (
          p.command.includes('next') || 
          p.command.includes('clean-standalone') || 
          p.command.includes('node_modules/.bin')
        ))
        .slice(0, 2); // Only monitor up to 2 most relevant processes
      
      if (processesToCheck.length === 0 && currentProcesses.length > 0) {
        // If we didn't find specific Next.js processes, just check the first one
        processesToCheck.push(currentProcesses[0]);
      }
      
      // Check memory for each selected process
      processesToCheck.forEach(({ pid }) => {
        const memoryMB = getProcessMemory(pid);
        
        // Only log when memory is high to reduce log spam
        if (memoryMB > MAX_MEMORY_MB * 0.8) {
          log(`Process ${pid} memory usage: ${memoryMB.toFixed(2)} MB`);
        }
        
        if (memoryMB > MAX_MEMORY_MB) {
          log(`WARNING: Process ${pid} exceeded memory threshold: ${memoryMB.toFixed(2)} MB`);
          if (killProcess(pid)) {
            log(`Process ${pid} was terminated to prevent system instability`);
            // Don't restart immediately, wait for the next interval
          }
        }
      });
    } catch (err) {
      log(`Error in auto monitoring cycle: ${err.message}`);
      consecutiveErrors++;
    }
  }, CHECK_INTERVAL);
}

// Initialize
(function() {
  log('Memory Monitor starting...');
  
  // Parse arguments
  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto');
  const debugMode = args.includes('--debug');
  
  // Set debug mode
  if (debugMode) {
    // More frequent logging in debug mode
    log('Running in debug mode with more verbose logging');
  }
  
  // In auto mode or if no PID provided
  if (autoMode) {
    runAutoMode();
  } else {
    const pidArg = args[0];
    if (pidArg && /^\d+$/.test(pidArg)) {
      monitorProcess(pidArg);
    } else {
      log('No valid process ID provided. Use --auto to automatically detect Next.js processes.');
      log('Usage: node memory-monitor.js [process-id] [--auto] [--debug]');
      process.exit(1);
    }
  }
})(); 