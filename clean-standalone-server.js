#!/usr/bin/env node

/**
 * Reliable standalone server for Snap2Health
 * 
 * Features:
 * - Automatic port cleanup
 * - Environment variable loading
 * - Proper static file handling
 * - Improved error handling
 * - Crash recovery
 * - Memory optimization
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const v8 = require('v8');

// Set higher Node.js memory limits
// This helps prevent memory-related killed processes
try {
  // Increase memory limit to 4GB if not already set
  if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`;
  }
} catch (e) {
  // Ignore any errors from memory limit setting
}

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${message}`);
}

// Monitor memory usage and trigger garbage collection when needed
let memoryWatcher = null;
function setupMemoryMonitoring() {
  const MEMORY_CHECK_INTERVAL = 60000; // Check every minute
  const GC_THRESHOLD_MB = 1500; // Trigger GC at 1.5GB usage
  
  memoryWatcher = setInterval(() => {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const rssMemoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
      
      if (heapUsedMB > GC_THRESHOLD_MB) {
        log(`Memory usage high (${heapUsedMB}MB), triggering garbage collection`);
        
        // Force garbage collection if available (requires --expose-gc flag)
        if (global.gc) {
          global.gc();
          // Log memory after GC
          const afterGC = process.memoryUsage();
          const heapAfterGC = Math.round(afterGC.heapUsed / 1024 / 1024);
          log(`After GC: ${heapAfterGC}MB heap used`);
        } else {
          log('Garbage collection not available. Run with --expose-gc flag for better memory management');
        }
      }
      
      // Log memory usage every 10 minutes (adjust as needed)
      const minutes = new Date().getMinutes();
      if (minutes % 10 === 0) {
        log(`Memory usage: ${heapUsedMB}MB heap, ${rssMemoryMB}MB total`);
      }
    } catch (err) {
      // Ignore memory monitoring errors
    }
  }, MEMORY_CHECK_INTERVAL);
}

// Check and free port 3000
async function checkAndFreePort() {
  log('Checking for processes using port 3000...');
  
  try {
    // Different approaches based on OS
    if (process.platform === 'win32') {
      // Windows
      try {
        // Find PIDs using the port
        const output = execSync('netstat -ano | findstr :3000', { stdio: 'pipe' }).toString();
        const lines = output.split('\n').filter(line => line.includes('LISTENING'));
        
        if (lines.length > 0) {
          log(`Found processes using port 3000. Attempting to kill...`);
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
              const pid = parts[4];
              log(`Killing process with PID ${pid}`);
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
            }
          }
        }
      } catch (err) {
        // No processes found or error in commands
        log('No processes found using port 3000 on Windows');
      }
    } else {
      // macOS/Linux
      try {
        const output = execSync('lsof -i :3000 -t', { stdio: 'pipe' }).toString();
        const pids = output.trim().split('\n').filter(Boolean);
        
        if (pids.length > 0) {
          log(`Found ${pids.length} processes using port 3000. Killing...`);
          
          for (const pid of pids) {
            log(`Killing process with PID ${pid}`);
            execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
          }
        }
      } catch (err) {
        // No processes found or error in commands
        log('No processes found using port 3000 on Unix');
      }
    }
    
    // Additional safety measure: use alternative approach
    try {
      if (process.platform === 'win32') {
        execSync('powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force -ErrorAction SilentlyContinue"', { stdio: 'pipe' });
      } else {
        execSync('pkill -f "node.*:3000"', { stdio: 'pipe' });
      }
    } catch (err) {
      // Ignore errors here
    }
    
    log('Port 3000 should now be free');
    
  } catch (error) {
    log(`Error freeing port: ${error.message}`);
    log('Continuing anyway...');
  }
}

// Load environment variables
function loadEnvVariables() {
  log('Loading environment variables...');
  
  // Load from .env.local first
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    log('.env.local file found, loading...');
    dotenv.config({ path: envLocalPath });
  } else {
    log('.env.local not found, checking for .env');
    
    // Fall back to .env
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      log('.env file found, loading...');
      dotenv.config({ path: envPath });
    } else {
      log('No environment files found.');
    }
  }
  
  // Set development variables if none provided
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  // Set basic required variables if missing
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    process.env.NEXT_PUBLIC_APP_ENV = 'development';
  }
  
  log(`Environment: ${process.env.NODE_ENV}`);
}

// Initialize and start the server
async function startServer() {
  try {
    // Set up server environment
    const dev = process.env.NODE_ENV !== 'production';
    const hostname = 'localhost';
    const port = parseInt(process.env.PORT || '3000', 10);
    
    // Configure next.js with memory optimization options
    const nextConfig = { 
      dev, 
      hostname, 
      port,
      conf: {
        // Add server-specific optimizations to reduce memory usage
        experimental: {
          optimizeCss: true,
          strictNextHead: true,
          memoryBasedWorkersCount: true
        },
        compress: true,
        poweredByHeader: false
      }
    };
    
    log(`Starting server in ${dev ? 'development' : 'production'} mode on port ${port}`);
    
    // Initialize Next.js
    const nextApp = next(nextConfig);
    const handle = nextApp.getRequestHandler();
    
    // Create Express app to handle requests
    const app = express();
    
    // Add cache headers middleware
    app.use((req, res, next) => {
      // For auth and profile routes, always clear cache
      if (req.url.includes('/api/') || req.url.includes('/login') || req.url.includes('/profile')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      // Handle static files
      if (req.url.startsWith('/_next/static/') || req.url.includes('.js') || req.url.includes('.css')) {
        // For static assets, use a longer cache
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (req.url.includes('/images/') || req.url.includes('.svg') || req.url.includes('.png') || req.url.includes('.jpg')) {
        // For images, use a medium cache
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else {
        // For everything else, no cache
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      // Add version header for debugging
      res.setHeader('X-Server-Version', Date.now().toString());
      
      // Let Next.js handle the request
      handle(req, res);
    });
    
    // Setup memory leak detection and limits
    if (dev) {
      setupMemoryMonitoring();
    }
    
    // Prepare and start the Next.js app
    await nextApp.prepare();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Add error handlers
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is in use, trying port ${port + 1}...`);
        server.listen(port + 1);
      } else {
        log(`Server error: ${err.message}`);
      }
    });
    
    // Start listening
    server.listen(port, (err) => {
      if (err) throw err;
      log(`> Server ready on http://${hostname}:${port}`);
      log('> Press Ctrl+C to stop');
      
      // Report memory stats after startup
      const memStats = process.memoryUsage();
      log(`Initial memory usage: ${Math.round(memStats.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memStats.rss / 1024 / 1024)}MB total`);
    });
    
    // Handle process termination
    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        log('Shutting down server...');
        // Clean up memory watcher
        if (memoryWatcher) {
          clearInterval(memoryWatcher);
        }
        server.close(() => {
          log('Server closed');
          process.exit(0);
        });
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      log(`Uncaught exception: ${err.message}`);
      log(err.stack);
      // Attempt to keep server running despite errors
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log('Unhandled promise rejection at:');
      log(promise);
      log(`Reason: ${reason}`);
      // Attempt to keep server running despite errors
    });
    
  } catch (error) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    log('Starting Snap2Health server...');
    
    // Free port 3000 if in use
    await checkAndFreePort();
    
    // Load environment variables
    loadEnvVariables();
    
    // Start the server
    await startServer();
  } catch (error) {
    log(`Error in main: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 