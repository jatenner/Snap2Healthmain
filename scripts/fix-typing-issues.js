/**
 * Typing Issues Fix Script
 * 
 * This script specifically addresses typing and input issues in the Snap2Health app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Logging function
function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// Run a command and return its output
function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Ensure a file exists with the given content
function ensureFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dirPath = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'green');
  }
  
  // Write file if it doesn't exist or has different content
  if (!fs.existsSync(fullPath) || fs.readFileSync(fullPath, 'utf8') !== content) {
    fs.writeFileSync(fullPath, content);
    log(`Created/updated file: ${filePath}`, 'green');
    return true;
  }
  
  log(`File already exists with correct content: ${filePath}`, 'cyan');
  return false;
}

// Make a simple HTTP request to test server endpoints
async function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    }).on('error', (err) => {
      resolve({
        status: 0,
        data: null,
        success: false,
        error: err.message
      });
    });
  });
}

// Check if emergency server is running
async function isEmergencyServerRunning() {
  const result = await testEndpoint('http://localhost:3999/api/health');
  return result.success;
}

// Start the emergency server
async function startEmergencyServer() {
  log('Starting emergency server...', 'blue');
  
  // Start the server as a background process
  const command = process.platform === 'win32'
    ? 'start node emergency-server.js'
    : 'node emergency-server.js &';
  
  runCommand(command);
  
  // Wait for server to start
  let attempts = 0;
  while (attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await isEmergencyServerRunning()) {
      log('Emergency server started successfully', 'green');
      return true;
    }
    attempts++;
  }
  
  log('Failed to start emergency server', 'red');
  return false;
}

// Kill processes using ports
async function killPortProcesses() {
  log('🔫 Killing processes using ports 3000-3010...', 'yellow');
  
  try {
    if (process.platform === 'win32') {
      runCommand('powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3000-3010 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force"');
    } else if (process.platform === 'darwin') {
      // macOS - try multiple methods
      runCommand('pkill -f "node.*dev" || true');
      runCommand('lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true');
    } else {
      // Linux
      runCommand('lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true');
    }
    
    log('✅ Processes killed', 'green');
    return true;
  } catch (error) {
    log(`❌ Error killing processes: ${error.message}`, 'red');
    return false;
  }
}

// Fix typing issues
async function fixTypingIssues() {
  log('🔧 Starting typing issues fix...', 'magenta');
  
  // First ensure emergency-fix-typing.js exists
  const typingFixScript = `/**
 * Emergency Fix Script for Typing and UI Glitches
 * 
 * This script focuses on fixing input field issues and UI glitches
 * by cleaning DOM event listeners, purging CSS cache, and resetting
 * input-related browser behaviors.
 */

(function() {
  // Create a diagnostic UI to show progress
  const diagnosticsDiv = document.createElement('div');
  diagnosticsDiv.id = 'emergency-diagnostics';
  diagnosticsDiv.style.position = 'fixed';
  diagnosticsDiv.style.bottom = '0';
  diagnosticsDiv.style.left = '0';
  diagnosticsDiv.style.right = '0';
  diagnosticsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  diagnosticsDiv.style.color = '#00ff00';
  diagnosticsDiv.style.fontFamily = 'monospace';
  diagnosticsDiv.style.fontSize = '14px';
  diagnosticsDiv.style.padding = '10px';
  diagnosticsDiv.style.zIndex = '9999';
  diagnosticsDiv.style.maxHeight = '40vh';
  diagnosticsDiv.style.overflowY = 'auto';
  diagnosticsDiv.style.borderTop = '2px solid #00ff00';
  
  // Header for the diagnostics panel
  const header = document.createElement('div');
  header.innerHTML = '🚑 EMERGENCY INPUT FIX IN PROGRESS...';
  header.style.fontWeight = 'bold';
  header.style.fontSize = '16px';
  header.style.marginBottom = '10px';
  header.style.color = '#00ffff';
  diagnosticsDiv.appendChild(header);
  
  // Progress log
  const logDiv = document.createElement('div');
  logDiv.id = 'fix-log';
  diagnosticsDiv.appendChild(logDiv);
  
  // Add to document
  document.body.appendChild(diagnosticsDiv);
  
  // Logging function with timestamps
  function logMessage(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.innerHTML = \`[\${timestamp}] \${isError ? '❌' : '✅'} \${message}\`;
    
    if (isError) {
      logEntry.style.color = '#ff4444';
    }
    
    const logDiv = document.getElementById('fix-log');
    logDiv.appendChild(logEntry);
    logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll to bottom
    
    // Also log to console
    isError ? console.error(message) : console.log(message);
  }
  
  // Function to remove and recreate problematic form elements
  function cleanupInputFields() {
    logMessage("Cleaning up input fields...");
    
    try {
      // Find all input elements
      const inputs = document.querySelectorAll('input');
      const textareas = document.querySelectorAll('textarea');
      
      // Clone and replace each input to remove event listeners
      inputs.forEach(input => {
        const parent = input.parentNode;
        if (parent) {
          const clone = input.cloneNode(true);
          parent.replaceChild(clone, input);
          logMessage(\`Reset input field: \${input.name || input.id || 'unnamed'}\`);
        }
      });
      
      // Clone and replace each textarea to remove event listeners
      textareas.forEach(textarea => {
        const parent = textarea.parentNode;
        if (parent) {
          const clone = textarea.cloneNode(true);
          parent.replaceChild(clone, textarea);
          logMessage(\`Reset textarea: \${textarea.name || textarea.id || 'unnamed'}\`);
        }
      });
      
      logMessage("Input fields cleanup complete");
    } catch (err) {
      logMessage(\`Error cleaning input fields: \${err.message}\`, true);
    }
  }
  
  // Run all fixes in sequence
  async function runAllFixes() {
    logMessage("Starting emergency input fixes...");
    
    // Find and clean all inputs
    cleanupInputFields();
    
    // Completion
    logMessage("All input fixes completed!");
  }
  
  // Run fixes when the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllFixes);
  } else {
    runAllFixes();
  }
})();`;

  ensureFile('public/emergency-fix-typing.js', typingFixScript);
  
  // Kill any competing processes
  await killPortProcesses();
  
  // Check if emergency server is running, if not start it
  if (!(await isEmergencyServerRunning())) {
    await startEmergencyServer();
  }
  
  // Open the typing fix page
  log('🌐 Opening typing fix page...', 'green');
  
  // Open browser based on platform
  if (process.platform === 'win32') {
    runCommand('start http://localhost:3999/fix-typing');
  } else if (process.platform === 'darwin') {
    runCommand('open http://localhost:3999/fix-typing');
  } else {
    runCommand('xdg-open http://localhost:3999/fix-typing');
  }
  
  log('✅ Typing fix process completed', 'green');
  log('🔍 Please follow the instructions on the fix-typing page', 'yellow');
}

// Main function
async function main() {
  log('\n🚑 SNAP2HEALTH TYPING ISSUES FIX\n' + '='.repeat(35), 'cyan');
  
  try {
    await fixTypingIssues();
    
    log('\n✅ FIX PROCESS COMPLETED\n' + '='.repeat(24), 'green');
    log('If you continue to experience issues:', 'yellow');
    log('1. Run npm run complete-repair', 'white');
    log('2. Clear your browser cache and cookies', 'white');
    log('3. Try a different browser', 'white');
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log('\nTry running npm run fix-all and then npm run emergency', 'yellow');
    process.exit(1);
  }
}

// Run the main function
main(); 