#!/usr/bin/env node

/**
 * Snap2Health Vercel Deployment Script
 * 
 * This script prepares and deploys the app to Vercel with all memory 
 * and authentication optimizations enabled.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print colored output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, silent = false) {
  try {
    if (!silent) {
      log(`Running: ${command}`, colors.dim);
    }
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

// Check if vercel.json exists and create it if not
function ensureVercelConfig() {
  log('\n📄 Checking Vercel configuration...', colors.blue);
  
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  
  if (!fs.existsSync(vercelConfigPath)) {
    log('Creating vercel.json configuration file...', colors.yellow);
    
    const vercelConfig = {
      "version": 2,
      "buildCommand": "npm run vercel-build",
      "outputDirectory": ".next",
      "installCommand": "npm install",
      "framework": "nextjs",
      "regions": ["sfo1"],
      "env": {
        "NEXT_PUBLIC_VERCEL_DEPLOYMENT": "true",
        "NODE_OPTIONS": "--max-old-space-size=4096 --expose-gc"
      },
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            },
            {
              "key": "Pragma",
              "value": "no-cache"
            },
            {
              "key": "Expires",
              "value": "0"
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    log('✅ vercel.json created successfully', colors.green);
  } else {
    log('✅ vercel.json exists', colors.green);
  }
}

// Check if the auth client fix is in place
function ensureAuthFix() {
  log('\n🔐 Checking authentication fixes...', colors.blue);
  
  const authClientFixPath = path.join(process.cwd(), 'public/auth-client-fix.js');
  
  if (!fs.existsSync(authClientFixPath)) {
    log('❌ Authentication fix script not found!', colors.red);
    log('Creating auth fix script...', colors.yellow);
    
    const authFixScript = `/**
 * GoTrueClient Instance Manager
 * 
 * This script prevents multiple Supabase auth client instances 
 * that can cause authentication conflicts and the error:
 * "Multiple GoTrueClient instances detected in the same browser context"
 */

(function() {
  // Flag to track initialization
  window.__SUPABASE_AUTH_INITIALIZED = false;
  
  // Track actual number of instances created
  let instanceCount = 0;
  
  // Clear any existing instances that might be causing issues
  function clearExistingClients() {
    try {
      // Clear any localStorage data that might be causing conflicts
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.token') || 
            key.startsWith('supabase.auth.refreshToken') ||
            key.startsWith('sb-') && key.includes('-auth-token')) {
          console.log('Cleaning up auth token:', key);
          localStorage.removeItem(key);
        }
      }
      
      // Force clear sessionStorage too
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('supabase') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      }
      
      console.log('Auth storage cleanup complete');
      return true;
    } catch (error) {
      console.error('Error cleaning auth storage:', error);
      return false;
    }
  }
  
  // Public method to fix auth storage
  window.__fixAuthStorage = clearExistingClients;
  
  // Register storage event listener to handle conflicts
  window.addEventListener('storage', function(e) {
    if (e.key && (e.key.startsWith('supabase.auth') || 
                 (e.key.startsWith('sb-') && e.key.includes('-auth-token')))) {
      console.log('Auth storage changed externally. Synchronizing...');
    }
  });
  
  // Override localStorage for better control
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key && key.startsWith('supabase.auth')) {
      console.log('Setting auth key:', key.substring(0, 20) + '...');
      // Remove any conflicting keys before setting
      for (const existingKey of Object.keys(localStorage)) {
        if (existingKey !== key && existingKey.startsWith('supabase.auth')) {
          if (existingKey.includes('refreshToken') && key.includes('refreshToken') ||
              existingKey.includes('token') && key.includes('token') && !key.includes('refreshToken')) {
            console.log('Removing conflicting auth key:', existingKey.substring(0, 20) + '...');
            localStorage.removeItem(existingKey);
          }
        }
      }
    }
    
    // Call the original function
    originalSetItem.call(localStorage, key, value);
  };
  
  // If we have an issue, clear everything on load
  clearExistingClients();
  
  console.log('Auth client fix script initialized');
})();`;
    
    fs.writeFileSync(authClientFixPath, authFixScript);
    log('✅ Created authentication fix script', colors.green);
  } else {
    log('✅ Authentication fix script exists', colors.green);
  }
  
  // Ensure login page loads the auth fix script
  const loginPagePath = path.join(process.cwd(), 'app/(auth)/login/page.tsx');
  
  if (fs.existsSync(loginPagePath)) {
    let loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
    
    if (!loginPageContent.includes('auth-client-fix.js')) {
      log('Adding auth fix script to login page...', colors.yellow);
      
      // Simple check if it's a React component
      if (loginPageContent.includes('export default function') || loginPageContent.includes('function LoginPage')) {
        // Try to add the Script import if it doesn't exist
        if (!loginPageContent.includes("import Script from 'next/script'")) {
          loginPageContent = loginPageContent.replace(
            /import (.*) from ['"](.*)['"];?/,
            "import $1 from '$2';\nimport Script from 'next/script';"
          );
        }
        
        // Add the Script tag to the component
        if (loginPageContent.includes('return (')) {
          loginPageContent = loginPageContent.replace(
            /return \(/,
            `return (\n    <>\n      <Script\n        src="/auth-client-fix.js"\n        strategy="beforeInteractive"\n        id="auth-fix-script"\n      />`
          );
          
          // Add closing tag if needed
          if (!loginPageContent.includes('</>')) {
            loginPageContent = loginPageContent.replace(
              /(\s*)(return \([^)]*\))/,
              '$1$2\n    </>'
            );
          }
          
          fs.writeFileSync(loginPagePath, loginPageContent);
          log('✅ Added auth fix script to login page', colors.green);
        } else {
          log('⚠️ Could not find return statement in login page', colors.yellow);
        }
      } else {
        log('⚠️ Login page does not appear to be a React component', colors.yellow);
      }
    } else {
      log('✅ Login page already loads auth fix script', colors.green);
    }
  } else {
    log('⚠️ Login page not found at expected path', colors.yellow);
  }
}

// Check if memory optimizations are in place
function ensureMemoryOptimizations() {
  log('\n🧠 Checking memory optimizations...', colors.blue);
  
  const lightweightServerPath = path.join(process.cwd(), 'lightweight-server.js');
  const adaptiveStartPath = path.join(process.cwd(), 'scripts/adaptive-start.js');
  
  if (!fs.existsSync(lightweightServerPath)) {
    log('❌ Lightweight server not found!', colors.red);
    log('Vercel deployment may fail without memory optimizations', colors.yellow);
    return false;
  } else {
    log('✅ Lightweight server exists', colors.green);
  }
  
  if (!fs.existsSync(adaptiveStartPath)) {
    log('⚠️ Adaptive start script not found', colors.yellow);
  } else {
    log('✅ Adaptive start script exists', colors.green);
  }
  
  // Update package.json scripts if needed
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts['vercel-build']) {
      packageJson.scripts['vercel-build'] = 'next build';
      modified = true;
      log('Added vercel-build script to package.json', colors.yellow);
    }
    
    if (!packageJson.scripts['start']) {
      packageJson.scripts['start'] = 'NODE_OPTIONS="--max-old-space-size=4096 --expose-gc" node server.js';
      modified = true;
      log('Updated start script with memory optimizations', colors.yellow);
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('✅ Updated package.json scripts', colors.green);
    } else {
      log('✅ Package.json scripts already configured', colors.green);
    }
  }
  
  return true;
}

// Main deployment function
async function deploy() {
  log('\n🚀 Snap2Health Vercel Deployment Tool', colors.bright + colors.blue);
  log('=================================\n');
  
  // Ensure the git repo is clean
  log('📋 Checking Git status...', colors.blue);
  try {
    const gitStatus = execSync('git status --porcelain').toString();
    if (gitStatus.trim()) {
      log('⚠️ You have uncomitted changes:', colors.yellow);
      console.log(gitStatus);
      log('Consider committing your changes before deploying', colors.yellow);
    } else {
      log('✅ Git repository is clean', colors.green);
    }
  } catch (error) {
    log('⚠️ Could not check git status', colors.yellow);
  }
  
  // Ensure all optimizations are in place
  ensureVercelConfig();
  ensureAuthFix();
  const memoryOptsOk = ensureMemoryOptimizations();
  
  if (!memoryOptsOk) {
    log('\n⚠️ Memory optimizations are not fully in place. Deployment may fail due to memory issues.', colors.yellow);
    log('   Consider adding the lightweight-server.js file before deploying.', colors.yellow);
  }
  
  // Check if Vercel CLI is installed
  log('\n🔍 Checking Vercel CLI...', colors.blue);
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    log('✅ Vercel CLI is installed', colors.green);
  } catch (error) {
    log('⚠️ Vercel CLI is not installed or not in PATH', colors.yellow);
    log('   You can install it with: npm i -g vercel', colors.yellow);
    log('   Alternatively, you can use npx vercel to deploy', colors.yellow);
  }
  
  // Deploy confirmation
  log('\n🚀 Ready to deploy to Vercel!', colors.bright + colors.green);
  log('\nRun one of the following commands to deploy:', colors.blue);
  log('1. vercel --prod', colors.green);
  log('2. npx vercel --prod  (if Vercel CLI is not installed)', colors.green);
  log('\nOr run manually from the Vercel dashboard after pushing to GitHub.', colors.blue);
}

// Run the deploy function
deploy().catch(err => {
  console.error('Deployment preparation failed:', err);
  process.exit(1);
}); 