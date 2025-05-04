#!/usr/bin/env node

/**
 * fix-dev-issues.js
 * 
 * Script to fix common development server issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing development server issues...');

// Kill processes on port 3000
function killPortProcesses() {
  console.log('📊 Checking for port conflicts...');
  try {
    execSync('node scripts/kill-ports.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Error running port cleanup:', error.message);
    return false;
  }
}

// Clean build cache
function cleanBuildCache() {
  console.log('🧹 Cleaning build cache...');
  
  try {
    // Remove .next directory
    if (fs.existsSync(path.join(__dirname, '..', '.next'))) {
      console.log('Removing .next directory...');
      fs.rmSync(path.join(__dirname, '..', '.next'), { recursive: true, force: true });
    }
    
    // Remove node_modules/.cache
    const cachePath = path.join(__dirname, '..', 'node_modules', '.cache');
    if (fs.existsSync(cachePath)) {
      console.log('Removing node_modules/.cache...');
      fs.rmSync(cachePath, { recursive: true, force: true });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error cleaning build cache:', error.message);
    return false;
  }
}

// Check package-lock.json
function checkPackageLock() {
  console.log('📦 Checking package-lock.json integrity...');
  
  const lockPath = path.join(__dirname, '..', 'package-lock.json');
  
  if (!fs.existsSync(lockPath)) {
    console.log('⚠️ package-lock.json not found, running npm install...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ Error running npm install:', error.message);
      return false;
    }
  }
  
  try {
    // Simple integrity check - try to parse it
    const lockContent = fs.readFileSync(lockPath, 'utf8');
    JSON.parse(lockContent);
    console.log('✅ package-lock.json is valid');
    return true;
  } catch (error) {
    console.log('⚠️ package-lock.json is corrupted, recreating...');
    
    try {
      fs.unlinkSync(lockPath);
      execSync('npm install', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ Error fixing package-lock.json:', error.message);
      return false;
    }
  }
}

// Check for common file issues
function checkCommonIssues() {
  console.log('🔎 Checking for common issues in code files...');
  
  const apiRoutePath = path.join(__dirname, '..', 'app', 'api', 'analyze-image', 'route.ts');
  
  if (fs.existsSync(apiRoutePath)) {
    console.log('Checking analyze-image API route...');
    
    try {
      const content = fs.readFileSync(apiRoutePath, 'utf8');
      
      // Check for missing function call
      if (content.includes('generateGoalInsights(goal || "General Wellness")') && 
          content.includes('function generatePizzaGoalInsights')) {
        console.log('⚠️ Found function name mismatch in analyze-image/route.ts. Running fix-analysis script...');
        execSync('node scripts/fix-analysis-issues.js', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('❌ Error checking analyze-image route:', error.message);
    }
  }
  
  return true;
}

// Verify Next.js installation
function verifyNextInstallation() {
  console.log('🔧 Verifying Next.js installation...');
  
  try {
    const result = execSync('npx next -v', { encoding: 'utf8' });
    console.log(`✅ Next.js version: ${result.trim()}`);
    return true;
  } catch (error) {
    console.log('⚠️ Next.js installation issues detected, reinstalling...');
    
    try {
      execSync('npm install next@latest react@latest react-dom@latest', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ Error reinstalling Next.js:', error.message);
      return false;
    }
  }
}

// Apply all fixes
async function applyFixes() {
  let success = true;
  
  success = killPortProcesses() && success;
  success = cleanBuildCache() && success;
  success = checkPackageLock() && success;
  success = checkCommonIssues() && success;
  success = verifyNextInstallation() && success;
  
  if (success) {
    console.log('✅ All fixes applied successfully!');
    console.log('🚀 You can now run the development server with "npm run dev"');
  } else {
    console.log('⚠️ Some fixes were not successful. You may need to:');
    console.log('1. Delete node_modules folder and run npm install');
    console.log('2. Ensure no other processes are using port 3000');
    console.log('3. Restart your computer to clear any hung processes');
  }
  
  return success;
}

// Run the fixes
applyFixes().catch(error => {
  console.error('Unhandled error:', error);
}); 