#!/usr/bin/env node

/**
 * Adaptive Server Startup Script
 * 
 * This script automatically detects your system's available memory
 * and starts the appropriate server configuration to prevent memory issues.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);
const os = require('os');

// Configuration
const PORT = 3000;
const MEMORY_THRESHOLDS = {
  ultraLight: 2, // GB - Use ultra-lightweight if less than this is available
  light: 4,      // GB - Use lightweight if less than this is available
  medium: 8      // GB - Use medium if less than this is available
};

const SERVER_CONFIGS = {
  ultraLight: {
    cmd: 'npm run dev:ultra-light',
    desc: 'ultra-lightweight',
    memoryLimit: 1536, // MB
    maxProcesses: 2,
    concurrency: 1
  },
  light: {
    cmd: 'npm run dev:light',
    desc: 'lightweight',
    memoryLimit: 2048, // MB
    maxProcesses: 4,
    concurrency: 2
  },
  medium: {
    cmd: 'npm run dev:medium',
    desc: 'medium weight',
    memoryLimit: 3072, // MB
    maxProcesses: 6,
    concurrency: 3
  },
  standard: {
    cmd: 'npm run dev',
    desc: 'standard',
    memoryLimit: 4096, // MB
    maxProcesses: 8,
    concurrency: 4
  }
};

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Get available system memory
async function getSystemMemory() {
  const totalMemGB = Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10;
  
  try {
    // Different commands based on OS
    if (process.platform === 'linux') {
      const { stdout } = await execAsync('free -g');
      const lines = stdout.trim().split('\n');
      const memInfo = lines[1].split(/\s+/);
      const availableGB = parseInt(memInfo[6], 10);
      return { total: totalMemGB, available: availableGB };
    } 
    else if (process.platform === 'darwin') { // macOS
      const { stdout } = await execAsync('vm_stat');
      const pageSize = 4096; // Default macOS page size
      const lines = stdout.split('\n');
      
      let free = 0;
      
      for (const line of lines) {
        if (line.includes('Pages free:')) {
          free += parseInt(line.split(':')[1].trim().replace('.', ''), 10) * pageSize;
        }
        if (line.includes('Pages inactive:')) {
          free += parseInt(line.split(':')[1].trim().replace('.', ''), 10) * pageSize;
        }
      }
      
      // Convert to GB
      const availableGB = Math.round((free / (1024 * 1024 * 1024)) * 10) / 10;
      return { total: totalMemGB, available: availableGB };
    }
    else if (process.platform === 'win32') { // Windows
      const { stdout } = await execAsync('wmic OS get FreePhysicalMemory /Value');
      const freeMemKB = parseInt(stdout.trim().split('=')[1], 10);
      const availableGB = Math.round((freeMemKB / (1024 * 1024)) * 10) / 10;
      return { total: totalMemGB, available: availableGB };
    }
    
    // Fallback if OS not recognized
    return { total: totalMemGB, available: totalMemGB * 0.2 }; // Assume 20% available as fallback
  } catch (error) {
    log(`Error getting system memory: ${error.message}`);
    return { total: totalMemGB, available: totalMemGB * 0.2 }; // Conservative fallback
  }
}

// Kill any lingering processes on the dev port
async function cleanupProcesses() {
  log('Cleaning up any existing processes...');
  
  try {
    if (process.platform === 'win32') {
      await execAsync(`for /f "tokens=5" %a in ('netstat -ano ^| find ":${PORT}" ^| find "LISTENING"') do taskkill /f /pid %a`);
    } else {
      await execAsync(`lsof -ti:${PORT} | xargs kill -9`);
    }
  } catch (err) {
    // Ignore errors as they likely mean no processes were found
  }
}

// Clean build cache to free up resources
async function cleanBuildCache() {
  log('Cleaning build cache...');
  
  try {
    await execAsync('rm -rf .next node_modules/.cache');
  } catch (err) {
    log(`Error cleaning cache: ${err.message}`);
  }
}

// Determine which configuration to use based on available memory
function selectConfiguration(availableMem) {
  if (availableMem < MEMORY_THRESHOLDS.ultraLight) {
    return SERVER_CONFIGS.ultraLight;
  } else if (availableMem < MEMORY_THRESHOLDS.light) {
    return SERVER_CONFIGS.light;
  } else if (availableMem < MEMORY_THRESHOLDS.medium) {
    return SERVER_CONFIGS.medium;
  } else {
    return SERVER_CONFIGS.standard;
  }
}

// Run the development server with selected configuration
async function runServer(config) {
  log(`Starting with command: ${config.cmd}`);
  
  return new Promise((resolve, reject) => {
    const serverProcess = exec(config.cmd);
    
    serverProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    serverProcess.on('exit', (code) => {
      log(`Error: Server exited with code ${code}`);
      
      if (code === 137 || code === 9) { // OOM kill
        resolve({
          success: false,
          message: 'Server was killed due to memory issues'
        });
      } else {
        resolve({
          success: false,
          message: `Server process exited with code ${code}`
        });
      }
    });
    
    // Allow cancelling the server with Ctrl+C
    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
  });
}

// Create optimized next.config files
function createOptimizedConfigs() {
  // Ultra-lightweight config
  const ultraLightConfig = `
module.exports = {
  swcMinify: true,
  images: {
    // Don't format images during development
    disableStaticImages: true,
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    // Remote patterns for images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize build
  optimizeFonts: false,
  reactStrictMode: false, 
  experimental: {
    optimizeCss: true,
    // Adjust concurrency for lower memory usage
    cpus: 1,
    workerThreads: false,
    // Optimize for development speed
    optimizePackageImports: ['react', 'react-dom', '@radix-ui'],
  }
};`;

  // Lightweight config
  const lightConfig = `
module.exports = {
  swcMinify: true,
  images: {
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    // Remote patterns for images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize build
  optimizeFonts: false,
  reactStrictMode: false,
  experimental: {
    optimizeCss: true,
    // Adjust concurrency for memory usage
    cpus: 2,
    // Optimize for development speed
    optimizePackageImports: ['react', 'react-dom', '@radix-ui'],
  }
};`;

  try {
    fs.writeFileSync(
      path.join(process.cwd(), 'next.config.ultra-light.js'), 
      ultraLightConfig
    );
    
    fs.writeFileSync(
      path.join(process.cwd(), 'next.config.light.js'), 
      lightConfig
    );
    
    return true;
  } catch (err) {
    log(`Error creating optimized configs: ${err.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Get available system memory
    const { total, available } = await getSystemMemory();
    log(`System memory: ${total}GB total, ${available}GB available`);
    
    // Clean up processes and cache
    await cleanupProcesses();
    await cleanBuildCache();
    
    // Create optimized configs
    createOptimizedConfigs();
    
    // Select configuration based on available memory
    const config = selectConfiguration(available);
    
    if (available < MEMORY_THRESHOLDS.ultraLight) {
      log('Low memory detected. Using ultra-lightweight configuration.');
    }
    
    // Run the server with the selected configuration
    let result = await runServer(config);
    
    // If ultra-lightweight server failed, try again with even more aggressive settings
    if (!result.success && config === SERVER_CONFIGS.ultraLight) {
      log(`${result.message}. Retrying with ultra-lightweight configuration...`);
      
      // Update package.json script for ultra-lightweight mode
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Ensure ultra-lightweight script exists
        if (!packageJson.scripts['dev:ultra-light']) {
          packageJson.scripts['dev:ultra-light'] = 'node scripts/kill-ports-improved.js --force && rm -rf .next node_modules/.cache && NODE_OPTIONS=\'--max-old-space-size=1536 --expose-gc --max-semi-space-size=16\' node lightweight-server.js';
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
      } catch (err) {
        log(`Error updating package.json: ${err.message}`);
      }
      
      result = await runServer(SERVER_CONFIGS.ultraLight);
      
      if (!result.success) {
        log('Error: Ultra-lightweight server failed. Please try again with even less memory usage.');
        process.exit(1);
      }
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Start the script
main(); 