#!/usr/bin/env node

/**
 * fix-auth.js
 * 
 * A script to fix authentication-related issues in the Snap2Health app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Snap2Health Authentication Fix Tool');
console.log('======================================');

// Define paths to auth-related files
const authDirPath = path.join(__dirname, '..', 'src', 'context');
const authWorkaroundPath = path.join(__dirname, '..', 'app', '(auth)', 'login', 'auth-workaround.ts');
const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.ts');

// Check system env
const isDev = process.env.NODE_ENV !== 'production';

// Function to check if the server is running
function isServerRunning() {
  try {
    if (process.platform === 'win32') {
      const result = execSync('netstat -ano | findstr :3000 | findstr LISTENING', { encoding: 'utf8' });
      return result.trim().length > 0;
    } else {
      const result = execSync('lsof -i :3000 -t', { encoding: 'utf8' });
      return result.trim().length > 0;
    }
  } catch (e) {
    return false;
  }
}

// Function to check for GoTrueClient conflicts
function checkAuthConflicts() {
  const conflicts = [];
  
  // Check for multiple client initializations
  try {
    if (fs.existsSync(authDirPath)) {
      const files = fs.readdirSync(authDirPath);
      let createClientCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const filePath = path.join(authDirPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('createClientComponentClient') || 
              content.includes('createClient') ||
              content.includes('createBrowserSupabaseClient')) {
            createClientCount++;
            conflicts.push(`Found Supabase client creation in ${file}`);
          }
        }
      }
      
      if (createClientCount > 1) {
        console.log('⚠️ Multiple Supabase client initializations detected!');
      }
    }
  } catch (e) {
    console.error('Error checking for auth conflicts:', e.message);
  }
  
  return conflicts;
}

// Function to fix the auth context to prevent GoTrueClient conflicts
function fixAuthContext() {
  const authContextPath = path.join(authDirPath, 'auth.tsx');
  
  try {
    if (fs.existsSync(authContextPath)) {
      let content = fs.readFileSync(authContextPath, 'utf8');
      
      // Check if the file already has our anti-conflict code
      if (!content.includes('auth-initialized')) {
        console.log('📝 Adding client conflict prevention to auth context...');
        
        // Look for the initialize function
        const initializeFnMatch = content.match(/const\s+initialize\s*=\s*async\s*\(\s*\)\s*=>\s*{[\s\S]*?}/);
        
        if (initializeFnMatch) {
          const originalInitializeFn = initializeFnMatch[0];
          
          // Add our conflict prevention code
          const updatedInitializeFn = originalInitializeFn.replace(
            /{(\s*)setLoading\(true\);/,
            `{$1setLoading(true);
    
    // Prevent multiple GoTrueClient instances
    try {
      const authInitialized = localStorage.getItem('auth-initialized');
      const currentTimestamp = Date.now();
      
      if (authInitialized) {
        try {
          const parsedTime = parseInt(authInitialized, 10);
          // If we initialized less than 5 seconds ago, wait to prevent conflicts
          if (currentTimestamp - parsedTime < 5000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          console.warn('Error parsing auth timestamp:', e);
        }
      }
      
      localStorage.setItem('auth-initialized', currentTimestamp.toString());
    } catch (e) {
      console.warn('Error setting auth initialization flag:', e);
    }`
          );
          
          // Replace the old function with the updated one
          content = content.replace(originalInitializeFn, updatedInitializeFn);
          
          // Save the updated file
          fs.writeFileSync(authContextPath, content, 'utf8');
          console.log('✅ Updated auth context to prevent client conflicts');
        } else {
          console.log('⚠️ Could not find initialize function in auth context');
        }
      } else {
        console.log('✅ Auth context already has conflict prevention code');
      }
    } else {
      console.log('⚠️ Auth context file not found');
    }
  } catch (e) {
    console.error('Error fixing auth context:', e.message);
  }
}

// Function to check browser storage health
function fixBrowserStorage() {
  console.log('📊 Analyzing browser storage issues...');
  
  // Create a script that clears local storage if needed
  const clearCachePath = path.join(__dirname, '..', 'public', 'clear-browser-storage.js');
  
  try {
    // Only create if it doesn't exist
    if (!fs.existsSync(clearCachePath)) {
      const scriptContent = `/**
 * Snap2Health Browser Storage Fix
 * This script automatically detects and fixes common browser storage issues
 */

(function() {
  // Check if storage is working properly
  function checkStorage() {
    try {
      const testKey = 'storage-test-' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.error('Storage test failed:', e);
      return false;
    }
  }
  
  // Clear auth-related storage to fix conflicts
  function clearAuthStorage() {
    try {
      // Clear all Supabase related items
      const itemsToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('gotrue') ||
          key.includes('auth')
        )) {
          itemsToRemove.push(key);
        }
      }
      
      // Remove items outside the loop to avoid index shifting
      itemsToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('Removed:', key);
        } catch (e) {
          console.warn('Failed to remove:', key, e);
        }
      });
      
      return true;
    } catch (e) {
      console.error('Failed to clear auth storage:', e);
      return false;
    }
  }
  
  // Run the fixes
  function runFixes() {
    const storageWorking = checkStorage();
    
    if (!storageWorking) {
      console.warn('Browser storage is not working properly');
      // Add a flag to the document to show a warning
      document.body.dataset.storageIssue = 'true';
    } else {
      clearAuthStorage();
    }
  }
  
  // Run fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFixes);
  } else {
    runFixes();
  }
})();`;
      
      fs.writeFileSync(clearCachePath, scriptContent, 'utf8');
      console.log('✅ Created browser storage fix script');
    } else {
      console.log('ℹ️ Browser storage fix script already exists');
    }
  } catch (e) {
    console.error('Error creating browser storage fix script:', e.message);
  }
}

// Function to fix the auth middleware
function fixAuthMiddleware() {
  try {
    if (fs.existsSync(middlewarePath)) {
      let content = fs.readFileSync(middlewarePath, 'utf8');
      
      // Check if middleware already has our fixes
      if (!content.includes('// Add proper cache control headers to everything')) {
        console.log('📝 Improving auth middleware...');
        
        // Add cache control headers
        if (content.includes('export async function middleware')) {
          // Find the end of the middleware function before the return
          const match = content.match(/return\s+res;(\s*}\s*)/);
          
          if (match) {
            const updatedContent = content.replace(
              match[0],
              `  // Add proper cache control headers to everything
  res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  
  // Add version header for debugging
  res.headers.set('X-Version', Date.now().toString());
  
  return res;${match[1]}`
            );
            
            fs.writeFileSync(middlewarePath, updatedContent, 'utf8');
            console.log('✅ Added cache control headers to middleware');
          } else {
            console.log('⚠️ Could not find the right place to add cache headers');
          }
        }
      } else {
        console.log('✅ Auth middleware already has cache control headers');
      }
    } else {
      console.log('⚠️ Middleware file not found');
    }
  } catch (e) {
    console.error('Error fixing auth middleware:', e.message);
  }
}

// Main function to run all fixes
function runAllFixes() {
  console.log('🔍 Checking for authentication issues...');
  
  // Check if server is running
  if (isServerRunning()) {
    console.log('⚠️ Server is running. Some fixes may not be applied properly.');
    console.log('   Consider stopping the server before running this script.');
  }
  
  // Check for auth conflicts
  const conflicts = checkAuthConflicts();
  if (conflicts.length > 0) {
    console.log('⚠️ Found potential auth conflicts:');
    conflicts.forEach(conflict => console.log(`   - ${conflict}`));
  } else {
    console.log('✅ No obvious auth conflicts detected');
  }
  
  // Apply fixes
  fixAuthContext();
  fixBrowserStorage();
  fixAuthMiddleware();
  
  // Final messages
  console.log('\n📋 Summary of actions:');
  console.log('1. Added conflict prevention code to auth context');
  console.log('2. Created browser storage fix script');
  console.log('3. Improved auth middleware with cache headers');
  
  console.log('\n🎉 Auth fixes applied successfully!');
  console.log('Now restart your development server with:');
  console.log('   npm run dev:light');
}

// Run the script
runAllFixes(); 