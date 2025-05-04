#!/usr/bin/env node

/**
 * toggle-real-auth.js
 * 
 * This script helps switch between demo authentication and real Supabase authentication.
 * It can be run from the command line to clear local storage and cookies that force demo mode.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.green}
╔════════════════════════════════════════════════════╗
║        Snap2Health Authentication Utility          ║
╚════════════════════════════════════════════════════╝${colors.reset}
`);

console.log(`${colors.cyan}This script helps you toggle between demo and real authentication.${colors.reset}\n`);

console.log(`${colors.yellow}IMPORTANT: This script only provides instructions. You need to manually${colors.reset}`);
console.log(`${colors.yellow}clear your browser data since Node.js cannot access your browser storage.${colors.reset}\n`);

rl.question(`What would you like to do?
1. Enable real Supabase authentication
2. Return to demo account
Enter your choice (1-2): `, (answer) => {
  if (answer === '1') {
    console.log(`\n${colors.green}✅ Enabling real Supabase authentication${colors.reset}\n`);
    console.log(`To enable real authentication, please:
    
1. Open your browser's developer tools (F12 or Right-click > Inspect)
2. Navigate to the "Application" or "Storage" tab
3. Under "Storage", select "Local Storage" and find your app's domain
4. Delete the following items if they exist:
   - use-local-auth
   - local-auth-user
   - auth-ready
   
5. Then select "Cookies" and delete these cookies:
   - use-local-auth
   - local-auth-user

6. Refresh the page and you should be redirected to the login page
7. Sign in with your Supabase account credentials

${colors.cyan}Alternatively, you can paste this code in your browser console:${colors.reset}

localStorage.removeItem('use-local-auth');
localStorage.removeItem('local-auth-user');
localStorage.removeItem('auth-ready');
document.cookie = "use-local-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "local-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
console.log('✅ Demo authentication cleared. Please refresh the page.');
`);
  } else if (answer === '2') {
    console.log(`\n${colors.yellow}⚠️ Returning to demo account${colors.reset}\n`);
    console.log(`To use the demo account, please:
    
1. Open your browser's developer tools (F12 or Right-click > Inspect)
2. Navigate to the "Console" tab
3. Paste and run this code:

${colors.cyan}const mockUser = {
  id: 'mock-user-id-' + Date.now(),
  email: 'demo@snap2health.com',
  name: 'Demo User',
  avatar: '/avatar-placeholder.png',
  avatar_url: '/avatar-placeholder.png',
  profile_completed: true,
  user_metadata: {
    username: 'Demo User',
    defaultGoal: 'General Wellness',
    height: '70',
    weight: '180',
    age: '35',
    gender: 'Male',
    activityLevel: 'Moderate'
  }
};

localStorage.setItem('use-local-auth', 'true');
localStorage.setItem('local-auth-user', JSON.stringify(mockUser));
document.cookie = "use-local-auth=true; path=/; max-age=86400";
console.log('✅ Demo mode activated. Please refresh the page.');${colors.reset}

4. Refresh the page and you should be logged in as the demo user
`);
  } else {
    console.log(`\n${colors.red}❌ Invalid choice. Please run the script again and select 1 or 2.${colors.reset}`);
  }
  
  rl.close();
}); 