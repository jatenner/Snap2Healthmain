#!/usr/bin/env node

/**
 * Memory Monitor for Next.js
 * 
 * This script monitors memory usage of Next.js applications and takes action
 * when memory exceeds thresholds to prevent crashes.
 * 
 * Options:
 *   --auto    Automatically restart server when memory is critically high
 *   --silent  Don't show regular memory usage updates
 */

const { exec, spawn } = require('child_process');
const os = require('os');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const POLL_INTERVAL = 15000; // Check every 15 seconds
const WARNING_THRESHOLD = 80; // Percent
const CRITICAL_THRESHOLD = 90; // Percent
const SHOW_PROCESSES_THRESHOLD = 85; // Percent

// Command line arguments
const AUTO_RESTART = process.argv.includes('--auto');
const SILENT = process.argv.includes('--silent');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Log with timestamp and color
function log(message, color = colors.white) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Get total and available system memory
async function getSystemMemory() {
  const totalMemGB = Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10;
  
  try {
    // Different commands based on OS
    if (process.platform === 'linux') {
      const { stdout } = await execAsync('free -m');
      const lines = stdout.trim().split('\n');
      const memInfo = lines[1].split(/\s+/);
      const availableMB = parseInt(memInfo[7], 10);
      const usedMB = parseInt(memInfo[2], 10);
      const totalMB = parseInt(memInfo[1], 10);
      return { 
        totalGB: totalMemGB,
        availableGB: availableMB / 1024,
        usedGB: usedMB / 1024, 
        usedPercent: Math.round((usedMB / totalMB) * 100)
      };
    } 
    else if (process.platform === 'darwin') { // macOS
      const { stdout } = await execAsync('vm_stat');
      const pageSize = 4096; // Default macOS page size
      const lines = stdout.split('\n');
      
      let free = 0;
      let total = os.totalmem();
      
      for (const line of lines) {
        if (line.includes('Pages free:')) {
          free += parseInt(line.split(':')[1].trim().replace('.', ''), 10) * pageSize;
        }
        if (line.includes('Pages inactive:')) {
          free += parseInt(line.split(':')[1].trim().replace('.', ''), 10) * pageSize;
        }
      }
      
      const used = total - free;
      const usedPercent = Math.round((used / total) * 100);
      
      return { 
        totalGB: totalMemGB,
        availableGB: free / (1024 * 1024 * 1024),
        usedGB: used / (1024 * 1024 * 1024),
        usedPercent
      };
    }
    else if (process.platform === 'win32') { // Windows
      const { stdout } = await execAsync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
      const lines = stdout.split('\n');
      
      let freeMemKB = 0;
      let totalMemKB = 0;
      
      for (const line of lines) {
        if (line.includes('FreePhysicalMemory')) {
          freeMemKB = parseInt(line.split('=')[1], 10);
        }
        if (line.includes('TotalVisibleMemorySize')) {
          totalMemKB = parseInt(line.split('=')[1], 10);
        }
      }
      
      const usedMemKB = totalMemKB - freeMemKB;
      const usedPercent = Math.round((usedMemKB / totalMemKB) * 100);
      
      return {
        totalGB: totalMemGB,
        availableGB: freeMemKB / (1024 * 1024),
        usedGB: usedMemKB / (1024 * 1024),
        usedPercent
      };
    }
    
    // Fallback for unsupported OS
    return { 
      totalGB: totalMemGB,
      availableGB: os.freemem() / (1024 * 1024 * 1024),
      usedGB: (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024),
      usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
    };
  } catch (error) {
    log(`Error getting system memory: ${error.message}`, colors.red);
    
    // Use Node.js built-in methods as fallback
    return { 
      totalGB: totalMemGB,
      availableGB: os.freemem() / (1024 * 1024 * 1024),
      usedGB: (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024),
      usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
    };
  }
}

// Get Next.js processes
async function getNextJsProcesses() {
  try {
    let command = '';
    
    if (process.platform === 'win32') {
      command = 'wmic process where "commandline like \'%next%\'" get processid,commandline';
    } else {
      command = 'ps aux | grep -i next | grep -v grep';
    }
    
    const { stdout } = await execAsync(command);
    return stdout;
  } catch (error) {
    log(`Error getting Next.js processes: ${error.message}`, colors.red);
    return '';
  }
}

// Get memory usage of a specific process
async function getProcessMemory(pid) {
  try {
    let command = '';
    
    if (process.platform === 'win32') {
      command = `wmic process where processid=${pid} get WorkingSetSize`;
    } else {
      command = `ps -o rss= -p ${pid}`;
    }
    
    const { stdout } = await execAsync(command);
    const memoryKB = parseInt(stdout.trim(), 10);
    return isNaN(memoryKB) ? 0 : memoryKB / 1024; // Convert to MB
  } catch (error) {
    log(`Error getting memory for process ${pid}: ${error.message}`, colors.yellow);
    return 0;
  }
}

// Forcefully restart Next.js server
async function restartServer() {
  log('Memory usage critical! Restarting Next.js server...', colors.red);
  
  try {
    // First kill any existing processes
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM node.exe /T');
    } else {
      await execAsync('pkill -9 -f "node.*next"');
    }
    
    // Wait a moment for processes to terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restart with lower memory limits
    const serverProcess = spawn('npm', ['run', 'dev:ultra-light'], {
      detached: true,
      stdio: 'inherit'
    });
    
    serverProcess.unref();
    log('Server restarted with lower memory settings', colors.green);
  } catch (error) {
    log(`Error restarting server: ${error.message}`, colors.red);
  }
}

// Main monitoring function
async function monitorMemory() {
  try {
    // Get system memory info
    const memory = await getSystemMemory();
    
    // Determine status color based on memory usage
    let statusColor = colors.green;
    if (memory.usedPercent >= WARNING_THRESHOLD) {
      statusColor = colors.yellow;
    }
    if (memory.usedPercent >= CRITICAL_THRESHOLD) {
      statusColor = colors.red;
    }
    
    // Display memory usage if not in silent mode
    if (!SILENT) {
      log(`Memory: ${memory.usedPercent}% used (${memory.usedGB.toFixed(1)}GB of ${memory.totalGB.toFixed(1)}GB)`, statusColor);
    }
    
    // Show detailed process info when memory usage is high
    if (memory.usedPercent >= SHOW_PROCESSES_THRESHOLD) {
      log('High memory usage detected! Checking Next.js processes...', colors.yellow);
      
      const processesOutput = await getNextJsProcesses();
      const processes = processesOutput.split('\n').filter(line => line.trim() !== '');
      
      for (const process of processes) {
        const pidMatch = process.match(/\b(\d+)\b/);
        if (pidMatch && pidMatch[1]) {
          const pid = pidMatch[1];
          const memoryMB = await getProcessMemory(pid);
          
          if (memoryMB > 0) {
            log(`Next.js process (PID: ${pid}) is using ${memoryMB.toFixed(1)}MB of memory`, colors.yellow);
          }
        }
      }
    }
    
    // Take action if memory usage is critical
    if (memory.usedPercent >= CRITICAL_THRESHOLD) {
      log('CRITICAL: Memory usage exceeds safe threshold!', colors.red);
      
      if (AUTO_RESTART) {
        await restartServer();
      } else {
        log('To prevent crashes, consider restarting your Next.js server or run with --auto flag', colors.yellow);
      }
    }
  } catch (error) {
    log(`Error during memory monitoring: ${error.message}`, colors.red);
  }
}

// Print startup message
log('Memory Monitor Started', colors.blue);
log(`Mode: ${AUTO_RESTART ? 'Auto-restart' : 'Monitor only'} | Output: ${SILENT ? 'Critical only' : 'Regular updates'}`, colors.blue);

// Run memory check immediately
monitorMemory();

// Set up periodic monitoring
setInterval(monitorMemory, POLL_INTERVAL);

// Clean exit on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log('Memory Monitor Stopped', colors.blue);
  process.exit(0);
}); 