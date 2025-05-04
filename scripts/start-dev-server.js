#!/usr/bin/env node

/**
 * start-dev-server.js
 * 
 * A robust script to start the Next.js development server with proper cleanup
 * and error handling to prevent common issues.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════╗
║        Snap2Health Development Server Starter      ║
╚════════════════════════════════════════════════════╝${colors.reset}
`);

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

/**
 * Kill processes using a specific port more aggressively
 */
async function killProcessOnPort(port) {
  try {
    console.log(`${colors.yellow}Checking if port ${port} is in use...${colors.reset}`);
    
    // First try to kill any node processes
    try {
      if (process.platform === 'win32') {
        // On Windows, kill all node processes
        execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
      } else {
        // On macOS/Linux
        execSync('pkill -9 node', { stdio: 'pipe' });
      }
      console.log(`${colors.yellow}Attempted to kill all Node.js processes${colors.reset}`);
      
      // Give it a moment to fully terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // It's fine if there are no processes to kill
    }
    
    if (await isPortInUse(port)) {
      console.log(`${colors.yellow}Port ${port} is still in use. Attempting to target specific process...${colors.reset}`);
      
      try {
        if (process.platform === 'win32') {
          // Windows
          execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { stdio: 'pipe' })
            .toString()
            .split('\n')
            .forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[4];
                try {
                  execSync(`taskkill /F /PID ${pid}`);
                  console.log(`${colors.green}Killed process ${pid} using port ${port}${colors.reset}`);
                } catch (e) {
                  // Ignore if process doesn't exist
                }
              }
            });
        } else {
          // macOS, Linux - More aggressive approach
          try {
            // First try standard method
            execSync(`lsof -i :${port} -t | xargs kill -9`, { stdio: 'pipe' });
            console.log(`${colors.green}Killed processes using port ${port}${colors.reset}`);
          } catch (e) {
            // If that fails, try individual processes
            try {
              const command = `lsof -i :${port} -t`;
              const pids = execSync(command, { stdio: 'pipe' }).toString().trim().split('\n');
              
              if (pids.length > 0 && pids[0] !== '') {
                pids.forEach(pid => {
                  try {
                    execSync(`kill -9 ${pid}`);
                    console.log(`${colors.green}Killed process ${pid} using port ${port}${colors.reset}`);
                  } catch (e) {
                    // Ignore if process doesn't exist
                  }
                });
              }
            } catch (e) {
              // Ignore if command fails
            }
          }
        }
      } catch (error) {
        // Command might fail if no process is using the port
        console.log(`${colors.yellow}No process found using port ${port} or unable to kill it.${colors.reset}`);
      }
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again after attempting to kill
      if (await isPortInUse(port)) {
        // One more desperate attempt
        try {
          if (process.platform !== 'win32') {
            // This is a more aggressive approach that might need sudo on some systems
            execSync(`lsof -i :${port} | grep LISTEN`, { stdio: 'pipe' })
              .toString()
              .split('\n')
              .forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 1) {
                  const pid = parts[1];
                  try {
                    execSync(`kill -9 ${pid}`);
                    console.log(`${colors.green}Killed process ${pid} using port ${port} (last attempt)${colors.reset}`);
                  } catch (e) {
                    // Ignore if process doesn't exist or permission denied
                  }
                }
              });
          }
        } catch (e) {
          // Ignore any errors in this desperate attempt
        }
        
        // Final check
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (await isPortInUse(port)) {
          console.log(`${colors.red}❌ Unable to free port ${port}. Please close the applications using it manually.${colors.reset}`);
          return false;
        }
      }
    }
    
    console.log(`${colors.green}✅ Port ${port} is available${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking port ${port}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Clean build directories
 */
function cleanBuildDirectories() {
  console.log(`${colors.blue}Cleaning build directories...${colors.reset}`);
  
  // Clean .next directory
  if (fs.existsSync('.next')) {
    try {
      fs.rmSync('.next', { recursive: true, force: true });
      console.log(`${colors.green}✅ Removed .next directory${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to remove .next directory: ${error.message}${colors.reset}`);
    }
  }
  
  // Clean node_modules/.cache
  const cacheDir = path.join('node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log(`${colors.green}✅ Removed node_modules/.cache directory${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to remove node_modules/.cache: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Check for API route issues
 */
function checkApiRoutes() {
  console.log(`${colors.blue}Checking API routes for common issues...${colors.reset}`);
  
  const analyzeImageRoute = path.join('app', 'api', 'analyze-image', 'route.ts');
  
  if (fs.existsSync(analyzeImageRoute)) {
    const routeContent = fs.readFileSync(analyzeImageRoute, 'utf8');
    
    // Check for missing generateGoalInsights function
    if (!routeContent.includes('function generateGoalInsights')) {
      console.error(`${colors.red}❌ Missing generateGoalInsights function in analyze-image/route.ts${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ generateGoalInsights function exists${colors.reset}`);
    }
    
    // Check for function mismatches
    if (routeContent.includes('generatePizzaGoalInsights(') && 
        !routeContent.includes('function generatePizzaGoalInsights')) {
      console.error(`${colors.red}❌ Function mismatch: calling generatePizzaGoalInsights but function might not exist${colors.reset}`);
    }
  } else {
    console.error(`${colors.red}❌ API route file not found: ${analyzeImageRoute}${colors.reset}`);
  }
}

/**
 * Start the development server
 */
async function startDevServer() {
  // Step 1: Kill any process on port 3000
  const portAvailable = await killProcessOnPort(3000);
  if (!portAvailable) {
    process.exit(1);
  }
  
  // Step 2: Clean directories for a fresh start
  cleanBuildDirectories();
  
  // Step 3: Check for API issues
  checkApiRoutes();
  
  // Step 4: Start Next.js development server
  console.log(`${colors.blue}Starting Next.js development server...${colors.reset}`);
  
  // Set NODE_OPTIONS to increase memory limit
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  const nextDev = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle server process events
  nextDev.on('error', (error) => {
    console.error(`${colors.red}❌ Failed to start server: ${error.message}${colors.reset}`);
    process.exit(1);
  });
  
  nextDev.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${colors.yellow}Server process was killed with signal: ${signal}${colors.reset}`);
    } else if (code !== 0) {
      console.error(`${colors.red}Server process exited with code: ${code}${colors.reset}`);
    } else {
      console.log(`${colors.green}Server process exited cleanly${colors.reset}`);
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log(`${colors.yellow}Received SIGINT. Shutting down server...${colors.reset}`);
    nextDev.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log(`${colors.yellow}Received SIGTERM. Shutting down server...${colors.reset}`);
    nextDev.kill('SIGTERM');
  });
}

// Run the main function
startDevServer().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 