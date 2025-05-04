/**
 * Snap2Health Emergency Server
 * 
 * This server provides emergency fixes and fallback functionality
 * when the main application is experiencing issues.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Use a different port to avoid conflicts with the main app
const PORT = 3999;

// Create the express app
const app = express();

// Serve static files with proper cache control
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Check for processes using ports
function checkPorts() {
  return new Promise((resolve) => {
    exec('lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010', (error, stdout) => {
      if (error) {
        console.log('No conflicting processes found');
        resolve([]);
        return;
      }
      
      const pids = stdout.trim().split('\n').filter(Boolean);
      resolve(pids);
    });
  });
}

// Kill a process by PID
function killProcess(pid) {
  return new Promise((resolve) => {
    exec(`kill -9 ${pid}`, (error) => {
      if (error) {
        console.log(`Failed to kill process ${pid}`);
        resolve(false);
        return;
      }
      console.log(`Process ${pid} killed`);
      resolve(true);
    });
  });
}

// API endpoint to check port conflicts
app.get('/api/check-ports', async (req, res) => {
  try {
    const conflictingPids = await checkPorts();
    res.json({
      hasConflicts: conflictingPids.length > 0,
      pids: conflictingPids
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to kill processes
app.get('/api/kill-process/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const success = await killProcess(pid);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'emergency',
    timestamp: new Date().toISOString()
  });
});

// Add diagnostics
app.get('/api/diagnostics', (req, res) => {
  try {
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    const memoryUsage = process.memoryUsage();
    
    // Check for available files
    const publicDir = path.join(__dirname, 'public');
    const files = {};
    
    // Check for critical files
    const criticalFiles = [
      'reset.html',
      'auth-reset.html',
      'emergency-fix.js',
      'emergency-fix-typing.js',
      'cache-invalidate.js',
      'input-fix.html'
    ];
    
    for (const file of criticalFiles) {
      files[file] = fs.existsSync(path.join(publicDir, file));
    }
    
    res.json({
      nodeVersion,
      platform,
      arch,
      memoryUsage,
      files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root path redirects to login or dashboard
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Login path serves a basic login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset.html'));
});

// Typing fix path serves the input fix page
app.get('/fix-typing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'input-fix.html'));
});

// Redirect to the appropriate fix page based on the issue
app.get('/fix/:issue', (req, res) => {
  const { issue } = req.params;
  
  switch (issue) {
    case 'typing':
    case 'input':
      res.redirect('/fix-typing');
      break;
    case 'auth':
      res.redirect('/auth-reset.html');
      break;
    default:
      res.redirect('/reset.html');
  }
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
          <p>The page you requested doesn't exist in emergency mode.</p>
          <div class="options">
            <div class="option">
              <a href="/reset.html">Go to Emergency Reset</a>
            </div>
            <div class="option">
              <a href="/fix-typing">Fix Typing Issues</a>
            </div>
            <div class="option">
              <a href="/auth-reset.html">Fix Authentication Issues</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', '🚑 Starting emergency server mode...');
  console.log('\x1b[32m%s\x1b[0m', '🚑 Emergency server running!');
  console.log('\x1b[36m%s\x1b[0m', `🌐 Open: http://localhost:${PORT}`);
  console.log('\x1b[33m%s\x1b[0m', '🧹 For a complete reset: http://localhost:3999/reset.html');
  console.log('\x1b[33m%s\x1b[0m', '🖮 For typing/input issues: http://localhost:3999/fix-typing');
  console.log('\x1b[33m%s\x1b[0m', '⚠️ If you need to reset auth: http://localhost:3999/auth-reset.html');
});
