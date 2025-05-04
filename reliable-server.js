/**
 * Snap2Health Reliable Emergency Server
 * 
 * This server runs on port 3456 (away from any standard ports)
 * and provides emergency recovery tools for fixing the application.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

// Use port 3456 to avoid any conflicts
const PORT = 3456;

// Create the express app
const app = express();

// Serve static files with cache-busting headers
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'emergency',
    timestamp: new Date().toISOString()
  });
});

// Diagnostic endpoint
app.get('/api/diagnostics', (req, res) => {
  try {
    const diagnostics = {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      files: {},
      processes: {}
    };
    
    // Check for critical files
    const publicDir = path.join(__dirname, 'public');
    const criticalFiles = [
      'reset-all.html',
      'emergency-fix.js',
      'emergency-fix-typing.js',
      'reset.html',
      'fix-input-issues.js'
    ];
    
    for (const file of criticalFiles) {
      diagnostics.files[file] = fs.existsSync(path.join(publicDir, file));
    }
    
    // Check port usage
    exec('lsof -ti:3000-3010', (error, stdout) => {
      if (error) {
        diagnostics.processes.portsInUse = false;
      } else {
        const pids = stdout.trim().split('\n').filter(Boolean);
        diagnostics.processes.portsInUse = pids.length > 0;
        diagnostics.processes.pids = pids;
      }
      
      res.json(diagnostics);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to kill processes
app.get('/api/kill/:pid', (req, res) => {
  try {
    const { pid } = req.params;
    
    exec(`kill -9 ${pid}`, (error) => {
      if (error) {
        res.json({ success: false, message: `Failed to kill process ${pid}` });
      } else {
        res.json({ success: true, message: `Process ${pid} killed` });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to kill all node processes
app.get('/api/kill-all-node', (req, res) => {
  try {
    // Kill all node processes except this one
    const currentPid = process.pid;
    
    exec(`ps -ef | grep node | grep -v ${currentPid} | awk '{print $2}' | xargs kill -9 2>/dev/null || true`, (error) => {
      if (error) {
        res.json({ success: false, message: 'Failed to kill all node processes' });
      } else {
        res.json({ success: true, message: 'All other node processes killed' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to run deep fix
app.get('/api/deep-fix', (req, res) => {
  try {
    // Simple fix without requiring the full deep-fix script
    // Kill all processes on ports 3000-3010
    exec('lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true', () => {
      // Clear caches
      exec('rm -rf .next && rm -rf node_modules/.cache', () => {
        // Fix FoodAnalysis component
        if (fs.existsSync('src/components/FoodAnalysis.tsx')) {
          const content = `'use client';

import React from 'react';
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

interface FoodAnalysisProps {
  imageUrl?: string;
  mealData?: any;
  isLoading?: boolean;
  onAnalyze?: (file?: File) => void;
  className?: string;
  goal?: string;
}

export function FoodAnalysis(props: FoodAnalysisProps) {
  return (
    <SimpleFoodAnalysis 
      imageUrl={props.imageUrl} 
      goal={props.goal || 'General Wellness'} 
    />
  );
}

export default FoodAnalysis;`;
          
          fs.writeFileSync('src/components/FoodAnalysis.tsx', content);
        }
        
        res.json({
          success: true,
          message: 'Fix applied successfully',
          timestamp: new Date().toISOString()
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to restart app on port 3001
app.get('/api/restart-app', (req, res) => {
  try {
    // Kill any existing processes on port 3001
    exec('lsof -ti:3001 | xargs kill -9 2>/dev/null || true', (error) => {
      // Start new process on port 3001
      const process = spawn('next', ['dev', '-p', '3001'], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.unref();
      
      res.json({
        success: true,
        message: 'App restarted on port 3001',
        url: 'http://localhost:3001',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redirect root to reset-all.html
app.get('/', (req, res) => {
  res.redirect('/reset-all.html');
});

// Handle 404s
app.use((req, res) => {
  res.status(404).send(`
    <html>
      <head>
        <title>Snap2Health - Page Not Found</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #020e2c;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          h1 { color: #5cd2ff; }
          a {
            color: #43b0ff;
            text-decoration: none;
          }
          .container {
            background: rgba(10, 32, 83, 0.6);
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          .options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
          }
          .option {
            background: rgba(30, 58, 123, 0.6);
            padding: 10px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Page Not Found</h1>
          <p>The page you requested doesn't exist on the emergency server.</p>
          <div class="options">
            <div class="option">
              <a href="/reset-all.html">Go to Emergency Reset</a>
            </div>
            <div class="option">
              <a href="/api/restart-app">Restart App on Port 3001</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Print colorful startup message
function logStartup() {
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const reset = '\x1b[0m';
  
  console.log('\n');
  console.log(`${green}======================================================${reset}`);
  console.log(`${green}  SNAP2HEALTH RELIABLE EMERGENCY SERVER${reset}`);
  console.log(`${green}======================================================${reset}`);
  console.log(`${cyan}🚑 Emergency server running!${reset}`);
  console.log(`${cyan}🌐 Open: ${yellow}http://localhost:${PORT}${reset}`);
  console.log(`${cyan}🧹 For a complete reset: ${yellow}http://localhost:${PORT}/reset-all.html${reset}`);
  console.log(`${green}======================================================${reset}`);
  console.log('\n');
}

// Start the server
app.listen(PORT, () => {
  logStartup();
  
  // Open the browser automatically
  if (process.platform === 'darwin') {
    exec(`open http://localhost:${PORT}/reset-all.html`);
  } else if (process.platform === 'win32') {
    exec(`start http://localhost:${PORT}/reset-all.html`);
  } else {
    exec(`xdg-open http://localhost:${PORT}/reset-all.html`);
  }
}); 