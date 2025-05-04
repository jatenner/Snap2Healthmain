#!/usr/bin/env node

/**
 * Ultra-lightweight Next.js development server with memory optimization
 * This server implements memory management features to prevent OOM crashes
 */

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const dotenv = require('dotenv');
const next = require('next');

// Configure environment
const PORT = parseInt(process.env.PORT, 10) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Memory settings
const MEMORY_LIMIT = 1200; // Maximum RSS memory (MB) before forced GC
const HEAP_LIMIT = 800;   // Maximum heap memory (MB) before forced GC
const LOW_MEMORY_THRESHOLD = 128; // Low memory MB threshold for emergency GC
const GC_INTERVAL = 30000; // Run GC every 30 seconds if needed

// Create a timestamp-based logger
function createLogger() {
  return {
    log: (message) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`);
    },
    error: (message) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ERROR: ${message}`);
    },
    warn: (message) => {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] WARNING: ${message}`);
    }
  };
}

// Create logger instance
const logger = createLogger();

// Load environment variables
function loadEnv() {
  logger.log('Loading environment variables...');
  
  // Check for .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    logger.log('.env.local file found, loading...');
    dotenv.config({ path: envLocalPath });
  } else {
    // Fall back to .env
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      logger.log('.env file found, loading...');
      dotenv.config({ path: envPath });
    }
  }
  
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

// Create auth client fix script
function createAuthClientFix() {
  try {
    // Generate a dedicated auth client fix script for client-side use
    const fixScriptPath = path.join(process.cwd(), 'public', 'auth-client-fix.js');
    
    if (!fs.existsSync(path.dirname(fixScriptPath))) {
      fs.mkdirSync(path.dirname(fixScriptPath), { recursive: true });
    }
    
    // Check if file exists and is recent
    const exists = fs.existsSync(fixScriptPath);
    
    // Always create a fresh copy to ensure latest fixes are applied
    // The actual content of this file should be maintained separately in version control
    if (!exists) {
      // Create a placeholder if the file doesn't exist in the repo
      const placeholderScript = `
      /**
       * Auth Client Fix Script (Placeholder)
       * This is a placeholder for the auth client fix. The actual script should be maintained in version control.
       */
       console.log('Auth client fix script loaded (placeholder)');
      `;
      
      fs.writeFileSync(fixScriptPath, placeholderScript);
      logger.log('Created auth client fix script placeholder');
    } else {
      logger.log('Auth client fix script exists');
    }
  } catch (error) {
    logger.error(`Error creating auth client fix script: ${error.message}`);
  }
}

// Get memory usage in MB
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const rss = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  return { rss, heapUsed, heapTotal };
}

// Force garbage collection if available
function forceGarbageCollection() {
  if (global.gc) {
    try {
      global.gc();
      logger.log('Manual garbage collection performed');
      return true;
    } catch (error) {
      logger.error(`Error during manual garbage collection: ${error.message}`);
      return false;
    }
  } else {
    logger.warn('Garbage collection not available. Start with --expose-gc flag.');
    return false;
  }
}

// Memory management system
function setupMemoryManagement() {
  let initialMemory = getMemoryUsage();
  logger.log(`Initial memory: ${initialMemory.rss}MB RSS, ${initialMemory.heapUsed}MB heap used`);
  
  // Perform initial garbage collection
  forceGarbageCollection();
  
  // Set up periodic memory monitoring and garbage collection
  const memoryInterval = setInterval(() => {
    try {
      const memory = getMemoryUsage();
      
      // Log memory usage
      logger.log(`Memory: ${memory.rss}MB RSS, ${memory.heapUsed}MB heap used, ${memory.heapTotal}MB heap total`);
      
      // Check if memory usage is high
      if (memory.rss > MEMORY_LIMIT) {
        logger.warn(`Critical memory usage (${memory.rss}MB > ${MEMORY_LIMIT}MB), forcing GC`);
        forceGarbageCollection();
        
        // If still high after GC, take emergency measures
        const postGcMemory = getMemoryUsage();
        if (postGcMemory.rss > MEMORY_LIMIT) {
          logger.error(`Memory still critical after GC: ${postGcMemory.rss}MB`);
          
          // Implement more aggressive memory reduction
          if (global.gc) {
            // Multiple forced GCs
            for (let i = 0; i < 3; i++) {
              global.gc(true); // true for full GC
            }
            
            // Clear module cache for non-essential modules
            Object.keys(require.cache).forEach(id => {
              // Don't clear critical modules
              if (!id.includes('node_modules/next') && 
                  !id.includes('node_modules/react') &&
                  !id.includes('lightweight-server')) {
                delete require.cache[id];
              }
            });
          }
        }
      } 
      // Warn if getting close to limit
      else if (memory.rss > MEMORY_LIMIT * 0.8) {
        logger.warn(`High memory usage (${memory.rss}MB > ${MEMORY_LIMIT * 0.8}MB)`);
        forceGarbageCollection();
      }
      // Run GC if heap is getting large
      else if (memory.heapUsed > HEAP_LIMIT) {
        logger.warn(`High heap usage (${memory.heapUsed}MB > ${HEAP_LIMIT}MB), running GC`);
        forceGarbageCollection();
      }
      // Run GC if system memory is low
      const availableMemory = getAvailableSystemMemory();
      if (availableMemory && availableMemory < LOW_MEMORY_THRESHOLD) {
        logger.warn(`Low system memory (${availableMemory}MB), running emergency GC`);
        forceGarbageCollection();
      }
    } catch (error) {
      logger.error(`Error in memory management: ${error.message}`);
    }
  }, GC_INTERVAL);
  
  // Clean up interval on exit
  process.on('exit', () => {
    clearInterval(memoryInterval);
  });
}

// Get available system memory in MB
function getAvailableSystemMemory() {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // For macOS and Linux
      const freeMem = execSync('vm_stat | grep "Pages free:" || free -m | grep Mem:').toString();
      
      if (freeMem.includes('Pages free:')) {
        // Parse macOS output (vm_stat)
        const matches = freeMem.match(/Pages free:\s+(\d+)/);
        if (matches && matches[1]) {
          const pageSize = 4096; // Standard page size on macOS
          const freePages = parseInt(matches[1], 10);
          return Math.round((freePages * pageSize) / (1024 * 1024));
        }
      } else {
        // Parse Linux output (free -m)
        const matches = freeMem.match(/Mem:\s+\d+\s+\d+\s+(\d+)/);
        if (matches && matches[1]) {
          return parseInt(matches[1], 10);
        }
      }
    } else if (process.platform === 'win32') {
      // For Windows
      const memInfo = execSync('wmic OS get FreePhysicalMemory /Value').toString();
      const matches = memInfo.match(/FreePhysicalMemory=(\d+)/);
      if (matches && matches[1]) {
        // Convert from KB to MB
        return Math.round(parseInt(matches[1], 10) / 1024);
      }
    }
  } catch (error) {
    logger.error(`Error getting system memory: ${error.message}`);
  }
  
  // Return null if we couldn't determine available memory
  return null;
}

// Kill processes using a specific port
async function killProcessesOnPort(port) {
  logger.log(`Checking for processes using port ${port}...`);
  
  try {
    if (process.platform === 'win32') {
      // Windows
      execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { stdio: 'pipe' })
        .toString()
        .split('\n')
        .forEach(line => {
          const match = line.match(/(\d+)$/);
          if (match) {
            const pid = match[1];
            try {
              execSync(`taskkill /F /PID ${pid}`);
              logger.log(`Killed process ${pid} using port ${port}`);
            } catch (err) {
              // Ignore errors when killing processes
            }
          }
        });
    } else {
      // Unix-like systems
      try {
        const output = execSync(`lsof -ti:${port}`, { stdio: 'pipe' }).toString().trim();
        if (output) {
          output.split('\n').forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`);
              logger.log(`Killed process ${pid} using port ${port}`);
            } catch (err) {
              // Ignore errors when killing processes
            }
          });
        } else {
          logger.log(`No processes found using port ${port} on Unix`);
        }
      } catch (err) {
        // lsof command might not be available or no processes found
        logger.log(`No processes found using port ${port} or lsof not available`);
      }
    }
    
    logger.log(`Port ${port} should now be free`);
    return true;
  } catch (error) {
    logger.log(`No processes found using port ${port}`);
    return true;
  }
}

// Start the Next.js server
async function startServer() {
  logger.log('Starting ultra-lightweight server in development mode');
  
  // First ensure the port is free
  await killProcessesOnPort(PORT);
  
  // Force garbage collection before starting
  forceGarbageCollection();
  
  // Create the auth fix script
  createAuthClientFix();
  
  try {
    // Create the Next.js app
    const app = next({ dev: isDev, quiet: false });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    // Create custom server
    const server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        logger.error(`Error handling request: ${err.message}`);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Start listening
    server.listen(PORT, (err) => {
      if (err) throw err;
      
      const memUsage = getMemoryUsage();
      logger.log(`> Ready on http://localhost:${PORT}`);
      logger.log(`Memory: ${memUsage.rss}MB RSS, ${memUsage.heapUsed}MB heap used, ${memUsage.heapTotal}MB heap total`);
      
      // Set up memory management after server is running
      setupMemoryManagement();
    });
    
    // Handle server errors
    server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Trying to free it...`);
        killProcessesOnPort(PORT).then(() => {
          logger.log('Retrying server start...');
          server.listen(PORT);
        });
      }
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

// Start the server
function main() {
  // Load environment variables first
  loadEnv();
  
  // Start the server
  startServer().catch(err => {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}

// Run the main function
main(); 