#!/usr/bin/env node

/**
 * Service Worker Fix Script
 * 
 * This script helps resolve common service worker issues by:
 * 1. Creating a proper service worker registration file
 * 2. Adding a service worker unregistration file
 * 3. Ensuring the reset.html page has the proper code to reset service workers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SW_FIX_PATH = path.join(PUBLIC_DIR, 'sw-fix.js');
const SW_PATH = path.join(PUBLIC_DIR, 'sw.js');
const RESET_HTML_PATH = path.join(PUBLIC_DIR, 'reset.html');

// Service worker code that properly handles errors
const swCode = `// Service Worker with proper error handling
self.addEventListener('install', (event) => {
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  console.log('Service worker installed');
});

self.addEventListener('activate', (event) => {
  // Claim clients to take control of all pages immediately
  event.waitUntil(
    clients.claim()
      .then(() => {
        console.log('Service worker activated and claimed clients');
      })
      .catch(err => {
        console.error('Error activating service worker:', err);
      })
  );
});

// Properly handle fetch events with error handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to avoid issues with POST/PUT etc.
  if (event.request.method !== 'GET') return;
  
  // Don't cache API requests or other dynamic content
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/auth/') ||
      event.request.url.includes('/_next/data/')) {
    return;
  }

  // For other requests, try cache with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return the cached version
          return cachedResponse;
        }
        // No cached version, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the successful responses for next time
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open('v1').then(cache => {
                try {
                  cache.put(event.request, responseClone);
                } catch (err) {
                  console.error('Error caching response:', err);
                }
              });
            }
            return response;
          })
          .catch(err => {
            console.error('Fetch failed:', err);
            // Return a fallback response or let the error propagate
            return new Response('Network error occurred', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
      .catch(err => {
        console.error('Cache match failed:', err);
        // Fallback to network
        return fetch(event.request)
          .catch(() => {
            return new Response('Network and cache both failed', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Add an error handler for uncaught promise rejections
self.addEventListener('unhandledrejection', event => {
  console.error('Service worker unhandled rejection:', event.reason);
});

// Log errors
self.addEventListener('error', event => {
  console.error('Service worker error:', event.message);
});

console.log('Service worker loaded successfully');
`;

// Service worker fix code with unregister functionality
const swFixCode = `// Service Worker Fix Functions

// Function to safely register a service worker
async function registerServiceWorker(swPath = '/sw.js') {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      });
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service Workers not supported in this browser');
    return null;
  }
}

// Function to unregister all service workers
async function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister each one
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log('Service worker unregistered:', result);
      }
      
      return registrations.length;
    } catch (error) {
      console.error('Error unregistering service workers:', error);
      return 0;
    }
  }
  return 0;
}

// Function to clear browser caches
async function clearAllCaches() {
  if ('caches' in window) {
    try {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Delete each cache
      const deletionPromises = cacheNames.map(cacheName => caches.delete(cacheName));
      const results = await Promise.all(deletionPromises);
      
      return cacheNames.length;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return 0;
    }
  }
  return 0;
}

// Function to safely reset the application state
async function resetAppState() {
  try {
    // Unregister service workers
    const swCount = await unregisterServiceWorkers();
    console.log(\`Unregistered \${swCount} service worker(s)\`);
    
    // Clear caches
    const cacheCount = await clearAllCaches();
    console.log(\`Cleared \${cacheCount} cache(s)\`);
    
    // Clear local storage
    localStorage.clear();
    console.log('Cleared local storage');
    
    // Clear session storage
    sessionStorage.clear();
    console.log('Cleared session storage');
    
    return {
      success: true,
      serviceWorkersRemoved: swCount,
      cachesCleared: cacheCount,
      storageCleared: true
    };
  } catch (error) {
    console.error('Error resetting app state:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Register the safe service worker management functions globally
window.appResetUtils = {
  registerServiceWorker,
  unregisterServiceWorkers,
  clearAllCaches,
  resetAppState
};

// Auto-execute if the URL includes a reset parameter
if (window.location.search.includes('reset=true')) {
  console.log('Reset parameter detected, performing app reset...');
  resetAppState().then(result => {
    console.log('Reset completed:', result);
    
    // Reload the page without the reset parameter
    const newUrl = window.location.href.replace('reset=true', '');
    window.location.href = newUrl;
  });
}

console.log('SW-FIX: Service worker utilities loaded');
`;

// Function to write a file with error handling
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created/updated ${path.relative(process.cwd(), filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing file ${path.relative(process.cwd(), filePath)}:`, error.message);
    return false;
  }
}

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory ${path.relative(process.cwd(), dirPath)}`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating directory ${path.relative(process.cwd(), dirPath)}:`, error.message);
      return false;
    }
  }
  return true;
}

// Main function
async function main() {
  console.log('🔧 Starting service worker fix...');
  
  // Ensure the public directory exists
  if (!ensureDirectoryExists(PUBLIC_DIR)) {
    console.error('❌ Could not create public directory, aborting');
    process.exit(1);
  }
  
  // Write the service worker file
  const swSuccess = writeFile(SW_PATH, swCode);
  
  // Write the service worker fix file
  const swFixSuccess = writeFile(SW_FIX_PATH, swFixCode);
  
  // Check if the reset.html file exists and has the proper script reference
  let resetHtmlNeedsUpdate = false;
  if (fs.existsSync(RESET_HTML_PATH)) {
    const resetHtmlContent = fs.readFileSync(RESET_HTML_PATH, 'utf8');
    if (!resetHtmlContent.includes('sw-fix.js')) {
      console.log('⚠️ reset.html exists but does not include the sw-fix.js script');
      resetHtmlNeedsUpdate = true;
    }
  } else {
    console.log('⚠️ reset.html does not exist, will be created');
    resetHtmlNeedsUpdate = true;
  }
  
  // Create or update reset.html if needed
  if (resetHtmlNeedsUpdate) {
    const resetHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snap2Health Emergency Reset</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        header {
            background: linear-gradient(135deg, #0070f3 0%, #00c6ff 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            margin: 0;
            font-size: 2.2em;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        button {
            background: #0070f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            margin-bottom: 10px;
            transition: background 0.3s ease;
        }
        button:hover {
            background: #0051a2;
        }
        button.danger {
            background: #e74c3c;
        }
        button.danger:hover {
            background: #c0392b;
        }
        button.success {
            background: #27ae60;
        }
        button.success:hover {
            background: #219653;
        }
        .log-container {
            background: #1e1e1e;
            color: #dcdcdc;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            height: 200px;
            overflow-y: auto;
            margin-top: 20px;
        }
        .log-entry {
            margin-bottom: 5px;
        }
        .status-message {
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            display: none;
        }
        .status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .progress-container {
            margin: 20px 0;
            display: none;
        }
        .progress-bar {
            height: 10px;
            background-color: #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #0070f3 0%, #00c6ff 100%);
            width: 0%;
            transition: width 0.4s ease;
        }
    </style>
    <script src="sw-fix.js"></script>
</head>
<body>
    <header>
        <h1>Snap2Health Emergency Reset</h1>
        <p>Use this tool to fix glitching and unresponsive UI issues</p>
    </header>
    
    <div class="card">
        <h2>Reset Tool</h2>
        <p>This will clear all caches, unregister service workers, and reset local storage to fix app issues.</p>
        
        <div class="actions">
            <button id="clearCacheBtn" class="danger">Clear Browser Caches</button>
            <button id="unregisterSWBtn" class="danger">Unregister Service Workers</button>
            <button id="fullResetBtn" class="danger">Full App Reset</button>
            <button id="backToAppBtn" class="success">Back to App</button>
        </div>
        
        <div id="progressContainer" class="progress-container">
            <div class="progress-bar">
                <div id="progressFill" class="progress-fill"></div>
            </div>
            <p id="progressText">Starting operation...</p>
        </div>
        
        <div id="statusMessage" class="status-message"></div>
        
        <div id="logContainer" class="log-container"></div>
    </div>
    
    <div class="card">
        <h2>What This Does</h2>
        <ul>
            <li>Clears the browser cache</li>
            <li>Unregisters service workers</li>
            <li>Resets local storage</li>
            <li>Forces reload of all app resources</li>
        </ul>
    </div>
    
    <script>
        // DOM elements
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        const unregisterSWBtn = document.getElementById('unregisterSWBtn');
        const fullResetBtn = document.getElementById('fullResetBtn');
        const backToAppBtn = document.getElementById('backToAppBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const statusMessage = document.getElementById('statusMessage');
        const logContainer = document.getElementById('logContainer');
        
        // Log function to display messages in the log container
        function log(message, type = 'info') {
            const entry = document.createElement('div');
            entry.classList.add('log-entry');
            
            // Format timestamp
            const now = new Date();
            const time = now.toTimeString().substr(0, 8);
            
            entry.textContent = \`[\${time}] \${message}\`;
            logContainer.appendChild(entry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        // Function to show status message
        function showStatus(message, type) {
            statusMessage.textContent = message;
            statusMessage.className = 'status-message';
            statusMessage.classList.add(\`status-\${type}\`);
            statusMessage.style.display = 'block';
            
            // Log the message as well
            log(message);
        }
        
        // Function to update progress
        function updateProgress(percent, message) {
            progressContainer.style.display = 'block';
            progressFill.style.width = \`\${percent}%\`;
            progressText.textContent = message;
            
            // Log the progress message
            log(message);
        }
        
        // Function to clear caches
        async function clearCaches() {
            try {
                updateProgress(10, 'Starting cache cleanup...');
                
                // Use our new utility from sw-fix.js
                const cacheCount = await window.appResetUtils.clearAllCaches();
                
                updateProgress(100, \`Cleared \${cacheCount} browser caches successfully\`);
                showStatus(\`\${cacheCount} browser caches cleared successfully\`, 'success');
                
                return true;
            } catch (error) {
                updateProgress(100, 'Error clearing caches');
                showStatus(\`Failed to clear caches: \${error.message}\`, 'error');
                
                return false;
            }
        }
        
        // Function to unregister service workers
        async function unregisterSW() {
            try {
                updateProgress(10, 'Finding service workers...');
                
                // Use our new utility from sw-fix.js
                const count = await window.appResetUtils.unregisterServiceWorkers();
                
                updateProgress(100, \`Unregistered \${count} service workers\`);
                showStatus(\`\${count} service worker(s) unregistered successfully\`, 'success');
                
                return true;
            } catch (error) {
                updateProgress(100, 'Error unregistering service workers');
                showStatus(\`Failed to unregister service workers: \${error.message}\`, 'error');
                
                return false;
            }
        }
        
        // Function to perform full reset
        async function fullReset() {
            try {
                updateProgress(10, 'Starting emergency reset...');
                
                // Use our full reset utility from sw-fix.js
                const result = await window.appResetUtils.resetAppState();
                
                updateProgress(80, 'App state reset completed');
                
                // Force reload from server without cache
                updateProgress(90, 'Preparing for reload...');
                
                showStatus('Reset completed successfully! Reloading app...', 'success');
                
                // Give user time to see the success message
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                
                return true;
            } catch (error) {
                updateProgress(100, 'Error during full reset');
                showStatus(\`Failed to complete reset: \${error.message}\`, 'error');
                
                return false;
            }
        }
        
        // Event listeners
        clearCacheBtn.addEventListener('click', () => {
            clearCaches();
        });
        
        unregisterSWBtn.addEventListener('click', () => {
            unregisterSW();
        });
        
        fullResetBtn.addEventListener('click', () => {
            fullReset();
        });
        
        backToAppBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // Log ready status when page loads
        window.addEventListener('load', () => {
            log('Reset tool ready');
            
            // Check if we have the reset utilities available
            if (window.appResetUtils) {
                log('Reset utilities loaded successfully');
            } else {
                log('WARNING: Reset utilities not available');
                showStatus('Reset utilities not loaded. Please try refreshing the page.', 'error');
            }
        });
    </script>
</body>
</html>`;
    
    writeFile(RESET_HTML_PATH, resetHtmlContent);
  }
  
  // Summary
  console.log('\n🔍 Service worker fix summary:');
  if (swSuccess) console.log('✅ Service worker code updated');
  if (swFixSuccess) console.log('✅ Service worker fix utility created');
  if (resetHtmlNeedsUpdate) console.log('✅ Reset page updated or created');
  
  console.log('\n🎉 Service worker fixes complete!');
  console.log('\nTo test the fixes:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:3000/reset.html to test the reset functionality');
  console.log('3. Use the emergency server for serious issues: npm run emergency');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 