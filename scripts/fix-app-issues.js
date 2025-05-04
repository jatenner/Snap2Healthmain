#!/usr/bin/env node

/**
 * fix-app-issues.js
 * 
 * This script fixes common issues with the Snap2Health app:
 * 1. Kills any processes using the app's ports
 * 2. Clears build cache and temporary files
 * 3. Cleans localStorage and cookies that might cause auth issues
 * 4. Performs a clean build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🔧 Snap2Health App Repair Tool 🔧
---------------------------------
This script will fix common issues with the Snap2Health app.
`);

// Step 1: Kill any processes using our ports
console.log('🔍 Killing processes using ports 3000-3010...');
try {
  execSync('node scripts/kill-ports.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error killing processes:', error.message);
}

// Step 2: Clear .next directory and node_modules cache
console.log('\n🧹 Clearing build caches...');
try {
  if (fs.existsSync('.next')) {
    console.log('Removing .next directory...');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  const cacheDir = path.join('node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    console.log('Removing node_modules/.cache directory...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  
  console.log('✅ Cache directories cleared');
} catch (error) {
  console.error('❌ Error clearing cache directories:', error.message);
}

// Step 3: Create a browser script to clear localStorage and cookies
console.log('\n📝 Creating browser script to clear auth data...');
try {
  const clearScript = `
/**
 * auth-reset.js
 * 
 * This script clears all authentication-related data from your browser.
 */
(function() {
  console.log('🔐 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('use-local-auth');
  localStorage.removeItem('local-auth-user');
  localStorage.removeItem('auth-ready');
  localStorage.removeItem('supabase.auth.token');
  
  // Clear cookies
  document.cookie.split(';').forEach(function(c) {
    document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  });
  
  console.log('✅ Authentication data cleared');
  console.log('Please sign in again with your real Supabase account');
  
  // Redirect to login
  window.location.href = '/login';
})();
`;

  fs.writeFileSync('public/auth-reset.js', clearScript);
  console.log('✅ Created auth-reset.js in public directory');
  
  // Create HTML page to run the script
  const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snap2Health Auth Reset</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #020e2c;
      color: white;
      text-align: center;
      padding: 0 20px;
    }
    h1 { margin-bottom: 10px; }
    p { margin-bottom: 30px; }
    button {
      background-color: #3B82F6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover { background-color: #2563EB; }
    .logo {
      margin-bottom: 30px;
      font-size: 28px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="logo">Snap2Health</div>
  <h1>Reset Authentication</h1>
  <p>This will clear all auth data and return you to the login screen.</p>
  <button onclick="resetAuth()">Reset Authentication Data</button>
  
  <script>
    function resetAuth() {
      localStorage.removeItem('use-local-auth');
      localStorage.removeItem('local-auth-user');
      localStorage.removeItem('auth-ready');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear cookies
      document.cookie.split(';').forEach(function(c) {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
      });
      
      alert('✅ Authentication data cleared. You will now be redirected to the login page.');
      window.location.href = '/login';
    }
  </script>
</body>
</html>
`;

  fs.writeFileSync('public/auth-reset.html', htmlPage);
  console.log('✅ Created auth-reset.html in public directory');
  
} catch (error) {
  console.error('❌ Error creating auth reset scripts:', error.message);
}

// Step 4: Verify the analyze-image route.ts file
console.log('\n🔍 Checking analyze-image API route...');
try {
  const routePath = path.join('app', 'api', 'analyze-image', 'route.ts');
  if (fs.existsSync(routePath)) {
    const routeContent = fs.readFileSync(routePath, 'utf8');
    
    // Check for the missing function
    if (!routeContent.includes('function generateGoalInsights')) {
      console.log('❌ Missing generateGoalInsights function. Please add it manually.');
    } else {
      console.log('✅ generateGoalInsights function found');
    }
    
    // Check for function name mismatches
    if (routeContent.includes('generatePizzaGoalInsights(goal)')) {
      console.log('❌ Found incorrect function call to generatePizzaGoalInsights. Please fix it.');
    } else {
      console.log('✅ No function name mismatches found');
    }
  } else {
    console.log('❌ Could not find analyze-image/route.ts file');
  }
} catch (error) {
  console.error('❌ Error checking analyze-image route:', error.message);
}

// Step 5: Run the build
console.log('\n🏗️ Running Next.js clean build...');
try {
  // Run clean-build script from package.json
  execSync('npm run clean-build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Error during build:', error.message);
}

console.log(`
✅ Repair process completed!

To use the app:
1. Run 'npm run dev' to start the development server
2. Visit http://localhost:3000/auth-reset.html to clear auth data
3. Sign in with your real Supabase account

If issues persist, try:
- npm install (to reinstall dependencies)
- Check browser console for errors
- Check that Supabase credentials are correctly set in .env.local
`); 