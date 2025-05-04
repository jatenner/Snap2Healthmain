#!/usr/bin/env node

/**
 * Enhanced Standalone Server for Snap2Health
 * - Handles port conflicts
 * - Manages cache issues
 * - Provides graceful error handling
 * - Supports automatic recovery
 */

const http = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const MAX_RETRIES = 3;

// ANSI colors for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

// Logging helper
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
      server.close();
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Kill processes using a specific port
async function killProcessOnPort(port) {
  try {
    log(`Attempting to free port ${port}...`, 'yellow');
    
    if (process.platform === 'win32') {
      // Windows
      try {
        execSync(`FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') DO taskkill /F /PID %P`, { stdio: 'pipe' });
      } catch (e) {
        // Command might fail if no process is found or permissions issues
      }
    } else {
      // Unix-based systems
      try {
        execSync(`lsof -i :${port} -t | xargs kill -9`, { stdio: 'pipe' });
      } catch (e) {
        // Command might fail if no process is found
      }
    }
    
    // Verify the port is now free
    const isStillInUse = await isPortInUse(port);
    return !isStillInUse;
  } catch (err) {
    log(`Error freeing port: ${err.message}`, 'red');
    return false;
  }
}

// Clean Next.js cache to resolve common issues
function cleanCache() {
  log('Cleaning Next.js cache to resolve potential issues...', 'blue');
  
  try {
    // Clean webpack cache which often causes issues
    const cachePath = path.join(process.cwd(), '.next', 'cache');
    if (fs.existsSync(cachePath)) {
      fs.rmSync(path.join(cachePath, 'webpack'), { recursive: true, force: true });
    }
    
    // Remove any potential corrupt module cache files
    const cacheFiles = [
      path.join(process.cwd(), 'node_modules', '.cache'),
      path.join(process.cwd(), '.next', 'cache')
    ];
    
    cacheFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.rmSync(file, { recursive: true, force: true });
          log(`Removed cache: ${file}`, 'green');
        } catch (e) {
          log(`Warning: Could not remove cache ${file}: ${e.message}`, 'yellow');
        }
      }
    });
    
    return true;
  } catch (err) {
    log(`Error cleaning cache: ${err.message}`, 'red');
    return false;
  }
}

// Start the Next.js server
async function startServer(retries = 0) {
  try {
    // Check if port is in use
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      log(`Port ${PORT} is already in use!`, 'red');
      
      const freed = await killProcessOnPort(PORT);
      if (!freed) {
        log(`Failed to free port ${PORT}. Please close the application using it manually.`, 'red');
        log(`You can try: npm run kill-ports`, 'yellow');
        process.exit(1);
      }
    }
    
    // Clean cache on first attempt or if we have retries
    if (retries > 0) {
      cleanCache();
    }
    
    // Create the Next.js app instance
    const dev = process.env.NODE_ENV !== 'production';
    const hostname = 'localhost';
    const app = next({ dev, hostname, port: PORT, dir: process.cwd() });
    const handle = app.getRequestHandler();
    
    log('Starting Next.js app...', 'blue');
    
    // Prepare the app
    await app.prepare();
    
    // Create server with error handling
    const server = http.createServer((req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Special handling for common error paths
        if (parsedUrl.pathname === '/favicon.ico' && !fs.existsSync('./public/favicon.ico')) {
          res.statusCode = 204; // No content
          res.end();
          return;
        }
        
        // Fix for missing logo.svg
        if (parsedUrl.pathname === '/logo.svg' && !fs.existsSync('./public/logo.svg')) {
          res.statusCode = 404;
          res.end();
          return;
        }
        
        // Let Next.js handle the request
        handle(req, res, parsedUrl);
      } catch (err) {
        log(`Error handling request: ${err.message}`, 'red');
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Add error handler for server
    server.on('error', (err) => {
      log(`Server error: ${err.message}`, 'red');
      
      if (err.code === 'EADDRINUSE') {
        log(`Port ${PORT} is still in use. Attempting to restart...`, 'yellow');
        
        if (retries < MAX_RETRIES) {
          setTimeout(() => {
            startServer(retries + 1);
          }, 1000);
        } else {
          log(`Failed to start server after ${MAX_RETRIES} attempts.`, 'red');
          log(`Try running with a different port: PORT=3001 node standalone-server.js`, 'yellow');
          process.exit(1);
        }
      }
    });
    
    // Start listening
    server.listen(PORT, (err) => {
      if (err) throw err;
      log(`> Starting server on http://localhost:${PORT}`, 'green');
      log(`> Ready on http://localhost:${PORT}`, 'green');
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully', 'yellow');
      server.close(() => {
        log('Server closed', 'green');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      log('SIGINT received, shutting down gracefully', 'yellow');
      server.close(() => {
        log('Server closed', 'green');
        process.exit(0);
      });
    });
    
  } catch (err) {
    log(`Error starting server: ${err.message}`, 'red');
    
    if (retries < MAX_RETRIES) {
      log(`Retrying (${retries + 1}/${MAX_RETRIES})...`, 'yellow');
      await cleanCache();
      setTimeout(() => {
        startServer(retries + 1);
      }, 1000);
    } else {
      log(`Failed to start server after ${MAX_RETRIES} attempts. Please check the following:`, 'red');
      log('1. Make sure port 3000 is not in use (npm run kill-ports)', 'gray');
      log('2. Try rebuilding the application (npm run clean-build)', 'gray');
      log('3. Check for syntax errors in your code', 'gray');
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'red');
  log('Server will attempt to continue operation, but stability is not guaranteed.', 'yellow');
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  log(`Unhandled rejection: ${err}`, 'yellow');
});

// Start the server
startServer(); 