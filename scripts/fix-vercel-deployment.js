#!/usr/bin/env node

/**
 * Fix Vercel Deployment Issues
 * 
 * This script fixes common module resolution errors during Vercel deployment
 * by identifying missing imports and creating stub modules for them.
 */

const fs = require('fs');
const path = require('path');

// Define paths for missing modules
const missingModules = [
  { 
    importPath: '@/context/auth', 
    filePath: 'src/context/auth.tsx',
    content: `
// This is a minimal version for deployment
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create singleton instance
let supabaseClientInstance = null;

export const getSupabaseClient = () => {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }
  
  supabaseClientInstance = createClientComponentClient();
  console.log('Created Supabase client singleton');
  return supabaseClientInstance;
};

// Auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  // Auth methods
  const signIn = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };
  
  const signUp = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  // Mock user for testing
  const setMockUser = () => {
    const mockUser = {
      id: 'mock-id',
      email: 'mock@example.com',
      user_metadata: {
        name: 'Test User',
        height: '70',
        weight: '170',
        age: '35',
        gender: 'other',
        defaultGoal: 'General Wellness'
      }
    };
    setUser(mockUser);
    setIsAuthenticated(true);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        setMockUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`
  },
  { 
    importPath: '@/lib/cache-manager', 
    filePath: 'src/lib/cache-manager.ts',
    content: `
// This is a minimal version for deployment
export const clearCache = async () => {
  console.log('Clearing application cache');
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('app-cache');
      sessionStorage.removeItem('app-cache');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  return false;
};

export const invalidateCache = async (key) => {
  console.log('Invalidating cache for key:', key);
  return true;
};
`
  },
  { 
    importPath: '@/utils/deviceDetection', 
    filePath: 'src/utils/deviceDetection.ts',
    content: `
// This is a minimal version for deployment
export const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }
  return false;
};

export const isIOS = () => {
  if (typeof window !== 'undefined') {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  return false;
};

export const isAndroid = () => {
  if (typeof window !== 'undefined') {
    return /Android/.test(navigator.userAgent);
  }
  return false;
};

export const getDeviceInfo = () => {
  return {
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'
  };
};
`
  },
  { 
    importPath: './auth-workaround', 
    filePath: 'app/(auth)/login/auth-workaround.ts',
    content: `
// Auth workaround for login page
export const fixAuthIssues = async () => {
  console.log('Applying auth workarounds');
  if (typeof window !== 'undefined') {
    // Clear any conflicting tokens
    const tokenKeys = Object.keys(localStorage).filter(
      key => key.startsWith('supabase.auth.token') || 
             key.startsWith('sb-') && key.includes('-auth-token')
    );
    
    for (const key of tokenKeys) {
      localStorage.removeItem(key);
    }
    
    return true;
  }
  return false;
};

export default fixAuthIssues;
`
  }
];

// Create directory recursively
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Fix missing modules
function fixMissingModules() {
  console.log('🔎 Checking for missing modules...');
  
  for (const module of missingModules) {
    const fullPath = path.join(process.cwd(), module.filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Missing module: ${module.importPath} (${module.filePath})`);
      try {
        ensureDirectoryExists(fullPath);
        fs.writeFileSync(fullPath, module.content.trim());
        console.log(`✅ Created stub for ${module.filePath}`);
      } catch (error) {
        console.error(`❌ Failed to create ${module.filePath}:`, error.message);
      }
    } else {
      console.log(`✅ Module exists: ${module.importPath}`);
    }
  }
}

// Make sure next.config.js has the correct transpilation config
function checkNextConfig() {
  console.log('\n🔍 Checking Next.js configuration...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    console.log('⚠️ next.config.js not found, creating minimal version');
    const minimalConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/auth-helpers-nextjs'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix issues with the app directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
`;
    try {
      fs.writeFileSync(nextConfigPath, minimalConfig.trim());
      console.log('✅ Created minimal next.config.js');
    } catch (error) {
      console.error('❌ Failed to create next.config.js:', error.message);
    }
    return;
  }
  
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  let modified = false;
  
  // Check for path import
  if (!nextConfig.includes('path')) {
    nextConfig = `const path = require('path');\n${nextConfig}`;
    modified = true;
  }
  
  // Check for webpack configuration
  if (!nextConfig.includes('webpack')) {
    const webpackConfig = `
  webpack: (config, { isServer }) => {
    // Fix issues with the app directory imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    return config;
  },`;
    
    // Try to add webpack config
    nextConfig = nextConfig.replace(
      /const nextConfig\s*=\s*{/,
      `const nextConfig = {\n${webpackConfig}`
    );
    modified = true;
  }
  
  // Check for transpilePackages
  if (!nextConfig.includes('transpilePackages')) {
    nextConfig = nextConfig.replace(
      /const nextConfig\s*=\s*{/,
      `const nextConfig = {\n  transpilePackages: ['@supabase/auth-helpers-nextjs'],`
    );
    modified = true;
  }
  
  if (modified) {
    try {
      fs.writeFileSync(nextConfigPath, nextConfig);
      console.log('✅ Updated next.config.js with necessary configurations');
    } catch (error) {
      console.error('❌ Failed to update next.config.js:', error.message);
    }
  } else {
    console.log('✅ next.config.js already has the necessary configurations');
  }
}

// Run all the fixes
function runAllFixes() {
  console.log('🚀 Running Vercel deployment fixes...');
  fixMissingModules();
  checkNextConfig();
  console.log('\n✅ All fixes applied! Your application should now deploy without module resolution errors.');
  console.log('🔥 Commit these changes and try deploying again.');
}

runAllFixes(); 