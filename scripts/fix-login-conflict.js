const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting login route conflict fix...');

// Check if app/login/page.tsx exists
const loginPagePath = path.join(process.cwd(), 'app', 'login', 'page.tsx');
const authLoginPath = path.join(process.cwd(), 'app', '(auth)', 'login', 'page.tsx');

// Create a simple redirect page
const redirectPageContent = `'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct login page
    router.replace('/auth/login');
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Login</h1>
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-gray-600">Please wait, you are being redirected to the login page...</p>
      </div>
    </div>
  );
}`;

// If both login files exist, create a simple redirect page
if (fs.existsSync(loginPagePath) && fs.existsSync(authLoginPath)) {
  console.log('✅ Found duplicate login pages');
  
  try {
    // Backup the original file
    if (fs.existsSync(loginPagePath)) {
      const backupPath = `${loginPagePath}.bak`;
      fs.copyFileSync(loginPagePath, backupPath);
      console.log(`✅ Created backup of original login page at ${backupPath}`);
    }
    
    // Write the redirect page
    fs.writeFileSync(loginPagePath, redirectPageContent);
    console.log('✅ Created login redirect page');
    
    console.log('🎉 Login route conflict fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing login conflict:', error);
  }
} else if (fs.existsSync(loginPagePath)) {
  console.log('✅ Only one login page found at app/login/page.tsx');
} else if (fs.existsSync(authLoginPath)) {
  console.log('✅ Only one login page found at app/(auth)/login/page.tsx');
  
  // Create the directory structure for the redirect
  if (!fs.existsSync(path.join(process.cwd(), 'app', 'login'))) {
    fs.mkdirSync(path.join(process.cwd(), 'app', 'login'), { recursive: true });
  }
  
  // Create the redirect page
  fs.writeFileSync(loginPagePath, redirectPageContent);
  console.log('✅ Created login redirect page');
} else {
  console.log('❌ No login pages found. Please check your app structure.');
}

// Kill any processes on port 3000
try {
  console.log('🔄 Restarting the development server...');
  execSync('npm run kill-ports', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ Could not kill processes on port 3000');
}

console.log('✅ Login conflict fix completed');
console.log('📋 To test: npm run kill-ports && node standalone-server-fix.js'); 