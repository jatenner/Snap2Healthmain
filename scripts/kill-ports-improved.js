#!/usr/bin/env node

/**
 * Enhanced Port Killer
 * 
 * This script kills all processes using ports 3000-3010 with improved reliability.
 * Use with --force flag to use more aggressive OS-specific commands.
 */

const { execSync } = require('child_process');
const { createServer } = require('http');

// Check if the --force flag is provided
const useForce = process.argv.includes('--force');

// Enhanced detection for Vercel and other restricted environments
function isRestrictedEnvironment() {
  // Check for explicit Vercel environment variables
  if (process.env.VERCEL === '1' || 
      process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT === 'true') {
    return true;
  }

  // Check if we're in CI/CD environment
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    return true;
  }

  // Try to detect if lsof is available (will handle serverless environments lacking system tools)
  try {
    // Use 'which' on Unix or 'where' on Windows to check if lsof exists
    if (process.platform === 'win32') {
      execSync('where lsof', { stdio: 'ignore' });
    } else {
      execSync('which lsof', { stdio: 'ignore' });
    }
    // If we get here, lsof is available
    return false;
  } catch (error) {
    // lsof command not found, likely in a restricted environment
    console.log('lsof command not available - assuming restricted environment');
    return true;
  }
}

// When running in Vercel environment, just pass through without trying to kill ports
if (isRestrictedEnvironment()) {
  console.log('Running in restricted environment (Vercel/CI/CD), skipping port checks');
  process.exit(0);
}

console.log('🔪 Enhanced Port Killer Script');
console.log(`Mode: ${useForce ? 'Force kill (aggressive)' : 'Standard kill'}`);

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Ports to check and free
const portsToCheck = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

// Helper to run commands safely
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      console.log(`${colors.blue}Running: ${colors.reset}${command}`);
    }
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    if (!silent) {
      console.log(`${colors.yellow}Command failed, but continuing: ${colors.reset}${command}`);
    }
    return false;
  }
}

// Check if a port is in use
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

// Main function to check and free ports
async function killPorts() {
  for (const port of portsToCheck) {
    console.log(`${colors.cyan}Checking port ${port}...${colors.reset}`);
    
    const inUse = await isPortInUse(port);
    if (!inUse) {
      console.log(`${colors.green}Port ${port} is already free.${colors.reset}`);
      continue;
    }
    
    console.log(`${colors.yellow}Port ${port} is in use. Attempting to free it...${colors.reset}`);
    
    // Try different OS-specific commands
    if (process.platform === 'win32') {
      // Windows commands
      try {
        // Find PID using the port
        const findCmd = `netstat -ano | findstr :${port}`;
        console.log(`${colors.blue}Finding processes on port ${port}...${colors.reset}`);
        
        const output = execSync(findCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
        // Extract PIDs
        const pids = new Set();
        output.split('\n').forEach(line => {
          const match = line.match(/(\d+)$/);
          if (match && match[1]) {
            pids.add(match[1]);
          }
        });
        
        // Kill each PID
        for (const pid of pids) {
          if (pid && pid !== '') {
            console.log(`${colors.blue}Killing process with PID ${pid}...${colors.reset}`);
            runCommand(`taskkill /F /PID ${pid}`);
          }
        }
      } catch (error) {
        console.log(`${colors.yellow}Error with standard Windows approach: ${colors.reset}${error.message}`);
        
        if (useForce) {
          // More aggressive alternative for Windows
          console.log(`${colors.magenta}Using aggressive method to kill port ${port}...${colors.reset}`);
          runCommand(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force"`, true);
        }
      }
    } else {
      // macOS and Linux commands
      try {
        // First check if lsof is available
        try {
          execSync('which lsof', { stdio: 'ignore' });
        } catch (error) {
          // lsof not available, try alternative approach with netstat
          throw new Error('lsof not available');
        }

        const findCmd = `lsof -i :${port} | grep LISTEN`;
        console.log(`${colors.blue}Finding processes on port ${port}...${colors.reset}`);
        
        const output = execSync(findCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
        // Extract PIDs
        const pids = new Set();
        output.split('\n').forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 1) {
            pids.add(parts[1]);
          }
        });
        
        // Kill each PID
        for (const pid of pids) {
          if (pid && pid !== '') {
            console.log(`${colors.blue}Killing process with PID ${pid}...${colors.reset}`);
            runCommand(`kill -9 ${pid}`);
          }
        }
      } catch (error) {
        console.log(`${colors.yellow}Error with standard Unix approach: ${colors.reset}${error.message}`);
        
        // Try alternative Unix approaches that might not require lsof
        try {
          console.log(`${colors.blue}Trying alternative approach with netstat...${colors.reset}`);
          const netstatOutput = execSync(`netstat -tulpn 2>/dev/null | grep :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          
          const pids = new Set();
          netstatOutput.split('\n').forEach(line => {
            const match = line.match(/\s(\d+)\/\w+\s*$/);
            if (match && match[1]) {
              pids.add(match[1]);
            }
          });
          
          for (const pid of pids) {
            if (pid && pid !== '') {
              console.log(`${colors.blue}Killing process with PID ${pid}...${colors.reset}`);
              runCommand(`kill -9 ${pid}`);
            }
          }
        } catch (netstatError) {
          console.log(`${colors.yellow}Alternative approach failed: ${colors.reset}${netstatError.message}`);
          
          if (useForce) {
            console.log(`${colors.magenta}Using last resort pkill approach...${colors.reset}`);
            // Try pkill which might be available in more environments
            runCommand(`pkill -f "node.*:${port}"`, true);
          }
        }
      }
    }
    
    // Verify port is now free
    const stillInUse = await isPortInUse(port);
    if (stillInUse) {
      console.log(`${colors.red}Port ${port} could not be freed!${colors.reset}`);
      
      if (!useForce) {
        console.log(`${colors.yellow}Try running with --force flag for more aggressive approach${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}Successfully freed port ${port}!${colors.reset}`);
    }
  }
}

// Handle errors
process.on('uncaughtException', error => {
  console.error(`${colors.red}Uncaught exception: ${colors.reset}${error.message}`);
  process.exit(1);
});

// Run the script
killPorts().then(() => {
  console.log(`${colors.green}Port killing process complete!${colors.reset}`);
}).catch(error => {
  console.error(`${colors.red}Error in port killing process: ${colors.reset}${error.message}`);
  process.exit(1);
}); 