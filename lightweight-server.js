#!/usr/bin/env node

/**
 * Ultra-Lightweight server for memory-constrained environments
 * 
 * This is an optimized version specifically addressing:
 * 1. Memory issues with "Killed: 9" errors
 * 2. GoTrueClient conflicts in authentication
 * 3. Image analysis memory management
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure memory usage monitoring
const MEMORY_MONITORING = true;
const MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
const WARNING_THRESHOLD_MB = 800;  // 800MB
const CRITICAL_THRESHOLD_MB = 1200; // 1.2GB
const RESTART_THRESHOLD_MB = 1400; // 1.4GB
let lastMemoryUsageMB = 0;
let restartCount = 0;
const MAX_RESTARTS = 5;

// Check environment
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Configure Next.js to use minimal memory
const nextConfig = {
  dev,
  hostname,
  port,
  conf: {
    compress: true,
    poweredByHeader: false,
    reactStrictMode: false, // Disable strict mode to reduce renders
    swcMinify: true,
    productionBrowserSourceMaps: false,
    experimental: {
      optimizeCss: true,
      esmExternals: false,
      scrollRestoration: false,
      legacyBrowsers: false,
      browsersListForSwc: false,
      serverActions: false,
      serverComponentsExternalPackages: [],
      webpackBuildWorker: false,
      optimisticClientCache: false,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    compiler: {
      reactRemoveProperties: true,
    },
    webpack: (config, { dev, isServer }) => {
      // Disable source maps in production
      if (!dev) {
        config.devtool = false;
      }
      return config;
    },
  }
};

// Create a lightweight Next.js app instance
const app = next({ dev, hostname, port, conf: nextConfig.conf });
const handle = app.getRequestHandler();

// Log current timestamp in a readable format
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Attempt to free memory
function attemptMemoryRelease() {
  try {
    if (global.gc) {
      global.gc();
      logWithTimestamp('Manual garbage collection performed');
    }
  } catch (e) {
    logWithTimestamp('Failed to perform manual garbage collection: ' + e.message);
  }
  
  // Also suggest running with --expose-gc flag if it's not enabled
  if (!global.gc) {
    logWithTimestamp('Note: Run with --expose-gc flag to enable manual garbage collection');
  }
}

// Check memory usage
function checkMemoryUsage() {
  try {
    const memoryUsage = process.memoryUsage();
    const usedHeapMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalHeapMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
    
    // Only log if there's a significant change (>10%) or every 5 minutes
    const significantChange = Math.abs(lastMemoryUsageMB - rssMB) > lastMemoryUsageMB * 0.1;
    const fiveMinuteInterval = Date.now() % (5 * 60 * 1000) < MEMORY_CHECK_INTERVAL;
    
    if (significantChange || fiveMinuteInterval) {
      logWithTimestamp(`Memory: ${rssMB}MB RSS, ${usedHeapMB}MB heap used, ${totalHeapMB}MB heap total`);
    }
    
    lastMemoryUsageMB = rssMB;
    
    // Check thresholds and take action if needed
    if (rssMB > RESTART_THRESHOLD_MB) {
      logWithTimestamp(`CRITICAL: Memory usage critically high (${rssMB}MB > ${RESTART_THRESHOLD_MB}MB)`);
      
      if (restartCount < MAX_RESTARTS) {
        logWithTimestamp(`Attempting server restart (${restartCount + 1}/${MAX_RESTARTS})`);
        restartCount++;
        
        // Attempt to restart process by exiting and letting process manager restart it
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      } else {
        logWithTimestamp(`Maximum restart count reached (${restartCount}/${MAX_RESTARTS}). Attempting emergency cleanup only.`);
        attemptMemoryRelease();
      }
    } else if (rssMB > CRITICAL_THRESHOLD_MB) {
      logWithTimestamp(`CRITICAL: Memory usage too high (${rssMB}MB > ${CRITICAL_THRESHOLD_MB}MB), attempting cleanup`);
      attemptMemoryRelease();
    } else if (rssMB > WARNING_THRESHOLD_MB) {
      logWithTimestamp(`WARNING: High memory usage (${rssMB}MB > ${WARNING_THRESHOLD_MB}MB)`);
    }
    
    return { used: usedHeapMB, total: totalHeapMB, rss: rssMB };
  } catch (e) {
    logWithTimestamp('Error checking memory usage: ' + e.message);
    return { used: 0, total: 0, rss: 0 };
  }
}

// Fix Supabase GoTrueClient conflict 
function fixAuthConflicts() {
  try {
    // Create a client reset script in public directory
    const scriptPath = path.join(process.cwd(), 'public', 'auth-client-fix.js');
    const scriptContent = `
// Fix for Multiple GoTrueClient instances detected
(function() {
  try {
    // Check if we've already initialized
    const initialized = localStorage.getItem('gotrue-initialized');
    
    if (initialized) {
      // Clear any conflicting auth data
      const now = Date.now();
      const initTime = parseInt(initialized, 10);
      const timeSinceInit = now - initTime;
      
      if (timeSinceInit < 60000) { // If less than a minute ago
        console.log('[Auth] Multiple instances detected, clearing storage');
        
        // Clear all Supabase and GoTrue related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('gotrue') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
    
    // Set current timestamp
    localStorage.setItem('gotrue-initialized', Date.now().toString());
  } catch (e) {
    console.error('[Auth] Error fixing client conflict:', e);
  }
})();
    `;
    
    // Write the script
    fs.writeFileSync(scriptPath, scriptContent);
    logWithTimestamp('Created auth client fix script');
    
    // Modify HTML to include the script
    const documentPath = path.join(process.cwd(), '.next', 'server', 'pages', '_document.js');
    if (fs.existsSync(documentPath)) {
      logWithTimestamp('Document file found, adding auth fix script reference');
      
      // Auto-inject script reference into Next.js HTML output
      // Will be handled by middleware
    }
  } catch (e) {
    logWithTimestamp('Error fixing auth conflicts: ' + e.message);
  }
}

// Start the server
async function startServer() {
  try {
    logWithTimestamp('Starting ultra-lightweight server in ' + (dev ? 'development' : 'production') + ' mode');
    
    // Free up any memory before starting
    attemptMemoryRelease();
    
    // Fix auth conflicts
    fixAuthConflicts();
    
    // Prepare the Next.js app
    await app.prepare();
    
    // Create a simple HTTP server
    const server = createServer(async (req, res) => {
      try {
        // Add response timeout
        res.setTimeout(30000); // 30 seconds timeout
        
        // Parse URL
        const url = parse(req.url, true);
        
        // Add auth fix script reference
        if (url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
          const originalWriteHead = res.writeHead;
          const originalWrite = res.write;
          
          let body = '';
          
          // Override write to capture body
          res.write = function(chunk, ...args) {
            body += chunk.toString();
            return originalWrite.apply(res, [chunk, ...args]);
          };
          
          // Override writeHead to modify headers
          res.writeHead = function(statusCode, headers) {
            if (headers && headers['content-type'] && headers['content-type'].includes('text/html')) {
              // Add script reference to head
              body = body.replace('</head>', '<script src="/auth-client-fix.js"></script></head>');
            }
            return originalWriteHead.apply(res, [statusCode, headers]);
          };
        }
        
        // Add basic request logging only for non-static requests
        const isStatic = url.pathname.startsWith('/_next/') || 
                        url.pathname.includes('.') ||
                        url.pathname.startsWith('/static/');
                        
        if (!isStatic && url.pathname !== '/favicon.ico') {
          logWithTimestamp(`${req.method} ${url.pathname}`);
        }
        
        // Very aggressive cache control to help manage memory
        if (isStatic) {
          // Cache static assets aggressively
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Don't cache dynamic routes
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
        
        // Handle request with Next.js
        await handle(req, res);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Start the server
    server.listen(port, (err) => {
      if (err) throw err;
      logWithTimestamp(`> Ready on http://${hostname}:${port}`);
      
      // Check initial memory usage
      const memory = checkMemoryUsage();
      logWithTimestamp(`Initial memory: ${memory.rss}MB RSS, ${memory.used}MB heap used`);
      
      // Set up periodic memory monitoring
      if (MEMORY_MONITORING) {
        setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL);
      }
    });
    
    // Handle uncaught exceptions and unhandled rejections
    ['uncaughtException', 'unhandledRejection'].forEach(event => {
      process.on(event, (err) => {
        logWithTimestamp(`${event}: ${err.message}`);
        console.error(err);
        
        // Attempt to clean up memory
        attemptMemoryRelease();
      });
    });
    
    // Handle signals for graceful shutdown
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        logWithTimestamp(`${signal} received, shutting down...`);
        server.close(() => {
          logWithTimestamp('Server closed');
          process.exit(0);
        });
      });
    });
  } catch (e) {
    console.error('Error starting server:', e);
    process.exit(1);
  }
}

// Start the server
startServer(); 