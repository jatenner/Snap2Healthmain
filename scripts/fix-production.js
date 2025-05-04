#!/usr/bin/env node

/**
 * Fix Production Issues Script
 * 
 * This script fixes common production issues with Snap2Health:
 * 1. Forces dynamic route handling for API routes
 * 2. Ensures FoodAnalysis.tsx is correctly set up
 * 3. Updates cache control headers for all responses
 * 4. Validates critical files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    if (error.stderr) {
      log(`Error: ${error.stderr}`, 'red');
    }
    return null;
  }
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Fix 1: Fix FoodAnalysis component
function fixFoodAnalysisComponent() {
  log('Checking FoodAnalysis.tsx component...', 'blue');
  
  const foodAnalysisPath = path.join(process.cwd(), 'src/components/FoodAnalysis.tsx');
  
  // Create compatibility wrapper
  const compatibilityCode = `'use client';

// This file is a compatibility wrapper that re-exports SimpleFoodAnalysis
// This ensures that any imports of FoodAnalysis still work
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

/**
 * @deprecated Use SimpleFoodAnalysis instead
 */
const FoodAnalysis = SimpleFoodAnalysis;

export default FoodAnalysis;
export { FoodAnalysis };`;

  // Force overwrite with the compatibility wrapper
  fs.writeFileSync(foodAnalysisPath, compatibilityCode);
  log('✅ Fixed FoodAnalysis.tsx by creating compatibility wrapper', 'green');
  
  return true;
}

// Fix 2: Create API helper file
function createApiHelperFile() {
  log('Creating/updating API helper file...', 'blue');
  
  const apiHelperPath = path.join(process.cwd(), 'src/lib/api-route-helper.ts');
  
  const apiHelperCode = `/**
 * API Route Helper
 * Contains utilities to properly handle API routes in both development and production
 */

import { NextRequest, NextResponse } from 'next/server';

// This tells Next.js that routes using this helper should be dynamic
export const dynamic = 'force-dynamic';

/**
 * Use this function to ensure API routes can use dynamic features like cookies
 * without breaking static generation during build
 */
export function createDynamicResponse(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  // Wrap the handler to include cache control headers
  return async function(req: NextRequest) {
    try {
      // Call the original handler
      const response = await handler(req);
      
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Skip-Static-Generation', 'true');
      
      // Add a timestamp to help with cache busting
      response.headers.set('X-Response-Time', new Date().toISOString());
      
      return response;
    } catch (error) {
      console.error('API route error:', error);
      
      // Return an error response with no-cache headers
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Skip-Static-Generation': 'true'
          }
        }
      );
    }
  };
}

/**
 * Helper function to create standardized API responses
 */
export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Skip-Static-Generation': 'true'
    }
  });
}`;

  fs.writeFileSync(apiHelperPath, apiHelperCode);
  log('✅ Created/updated API helper file', 'green');
  
  return true;
}

// Fix 3: Update next.config.js
function updateNextConfig() {
  log('Updating Next.js configuration...', 'blue');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fileExists(nextConfigPath)) {
    log('❌ next.config.js not found!', 'red');
    return false;
  }
  
  let configContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Add rewrites instead of unstable_allowDynamic
  if (!configContent.includes('rewrites') || !configContent.includes('x-skip-static-generation')) {
    // Find a good insertion point
    const insertPosition = configContent.indexOf('staticPageGenerationTimeout');
    if (insertPosition > 0) {
      const beforeInsert = configContent.slice(0, insertPosition);
      const afterInsert = configContent.slice(insertPosition);
      
      const dynamicRoutesConfig = `  // Force all API routes to be dynamic
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'x-skip-static-generation',
            value: 'true'
          }
        ]
      }
    ];
  },
  // Skip static generation for any pages that need cookies or dynamic data
`;
      
      configContent = beforeInsert + dynamicRoutesConfig + afterInsert;
      fs.writeFileSync(nextConfigPath, configContent);
      log('✅ Updated next.config.js with dynamic routes configuration', 'green');
    }
  } else {
    log('✅ Dynamic routes already configured in next.config.js', 'green');
  }
  
  return true;
}

// Fix 4: Add force-dynamic markers to key API routes
function fixApiRoutes() {
  log('Checking key API routes...', 'blue');
  
  const apiRoutes = [
    'app/api/analyze-image/route.ts',
    'app/api/upload-image/route.ts',
    'app/api/meal-history/route.ts',
    'app/api/save-meal/route.ts'
  ];
  
  let fixedCount = 0;
  
  apiRoutes.forEach(routePath => {
    const fullPath = path.join(process.cwd(), routePath);
    if (fileExists(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if dynamic directive is missing
      if (!content.includes('dynamic') || !content.includes('force-dynamic')) {
        // Add the directive at the top of the file
        const newContent = `import { NextRequest, NextResponse } from 'next/server';
import { createDynamicResponse, apiResponse } from '@/lib/api-route-helper';

// Explicitly mark this route as dynamic to prevent build errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

` + content;
        
        fs.writeFileSync(fullPath, newContent);
        log(`✅ Added dynamic directive to ${routePath}`, 'green');
        fixedCount++;
      }
    } else {
      log(`⚠️ API route not found: ${routePath}`, 'yellow');
    }
  });
  
  if (fixedCount > 0) {
    log(`✅ Fixed ${fixedCount} API routes`, 'green');
  } else {
    log('✅ All API routes already include dynamic directives', 'green');
  }
  
  return true;
}

// Add middleware creation function
function createMiddlewareFile() {
  log('Creating/updating middleware file...', 'blue');
  
  const middlewareFilePath = path.join(process.cwd(), 'middleware.ts');
  
  const middlewareContent = `import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/history',
  '/meal-analysis',
  '/meal/',
];

// Routes that are only accessible to non-authenticated users
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

// Paths that don't require authentication
const publicPaths = ['/login', '/signup', '/_next', '/api', '/favicon.ico', '/images', '/uploads'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req, res });

  // Check if we're using auth bypass for development
  const bypassAuth = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  if (bypassAuth) {
    // Skip auth check in development mode with bypass
    return res;
  }

  // Get the path from the URL
  const path = req.nextUrl.pathname;
  
  // Refresh session if it exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => path.startsWith(route));

  // Handle protected routes (redirect to login if not authenticated)
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', 'true');
    return NextResponse.redirect(redirectUrl);
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Add cache-busting headers for authenticated routes
  if (session) {
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Return the response with the cache headers
    return NextResponse.next({
      request: {
        headers: req.headers,
      },
      headers,
    });
  }

  // Add proper cache control headers to everything
  res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  
  // Add version header for debugging
  res.headers.set('X-Version', Date.now().toString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  // Add CORS headers to all responses
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');

  // Skip middleware for public paths
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return res;
  }

  return res;
}

// Handle CORS preflight requests
function handleCors(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}`;

  fs.writeFileSync(middlewareFilePath, middlewareContent);
  log('✅ Created/updated middleware file', 'green');
  
  return true;
}

// Add a fix for the auth library issues
function updateAuthHelper() {
  log('Updating auth helpers...', 'blue');

  const authHelperPath = path.join(process.cwd(), 'src/lib/auth.ts');
  
  // Create directory if it doesn't exist
  const authHelperDir = path.dirname(authHelperPath);
  if (!fs.existsSync(authHelperDir)) {
    fs.mkdirSync(authHelperDir, { recursive: true });
  }
  
  const authHelperContent = `/**
 * Authentication helpers for Snap2Health
 */
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * Get current authenticated user ID from session
 * Returns { userId, error }
 */
export async function getUserIdFromSession(req?: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      return { userId: null, error: sessionError };
    }
    
    // Check if we're allowing bypass for development
    const bypassAuth = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    const userId = session?.user?.id || (bypassAuth ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!userId && !bypassAuth) {
      return { userId: null, error: new Error('User not authenticated') };
    }
    
    return { userId, error: null };
  } catch (error) {
    console.error('Auth error:', error);
    return { userId: null, error };
  }
}

/**
 * Check if user is authenticated, redirect to login if not
 */
export async function requireAuth() {
  const { userId, error } = await getUserIdFromSession();
  
  if (!userId || error) {
    // Add a query parameter for redirect after login
    redirect('/login?redirect=true');
  }
  
  return userId;
}

/**
 * Get current user profile data
 */
export async function getUserProfile() {
  try {
    const { userId, error } = await getUserIdFromSession();
    
    if (!userId || error) {
      return { profile: null, error: new Error('Not authenticated') };
    }
    
    const supabase = createServerComponentClient({ cookies });
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return { profile: null, error: profileError };
    }
    
    return { profile, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Check auth status, return { user, profile, isLoading, error }
 * Client-side version
 */
export function useAuth() {
  const supabase = createClientComponentClient();
  
  // This is a stub - to be expanded with React hooks if needed
  // For now, we'll just provide the server functions
  
  return {
    supabase,
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };
}

/**
 * Create auth response with no-cache headers
 */
export function createAuthResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}`;
  
  fs.writeFileSync(authHelperPath, authHelperContent);
  log('✅ Updated auth helper functions', 'green');
  
  return true;
}

// Main function
async function main() {
  log('🔧 Starting production fixes for Snap2Health...', 'magenta');
  
  // Run all fixes
  let success = true;
  
  // Fix 1: FoodAnalysis component
  success = fixFoodAnalysisComponent() && success;
  
  // Fix 2: API helper file
  success = createApiHelperFile() && success;
  
  // Fix 3: Next.js config
  success = updateNextConfig() && success;
  
  // Fix 4: API routes
  success = fixApiRoutes() && success;
  
  // NEW Fix 5: Create middleware for auth
  success = createMiddlewareFile() && success;
  
  // NEW Fix 6: Update auth helper
  success = updateAuthHelper() && success;
  
  // Final result
  if (success) {
    log('🎉 All production fixes applied successfully!', 'magenta');
    log('Run the following commands to deploy the fixed version:', 'cyan');
    log('1. npm run clean-build', 'yellow');
    log('2. npm run deploy', 'yellow');
  } else {
    log('⚠️ Some fixes could not be applied. Please check the logs above.', 'red');
  }
}

// Run the main function
main().catch(error => {
  log(`Error during fix: ${error.message}`, 'red');
  process.exit(1);
}); 