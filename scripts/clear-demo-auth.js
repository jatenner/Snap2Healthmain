#!/usr/bin/env node

/**
 * clear-demo-auth.js
 * 
 * This script clears any local mock authentication data to ensure
 * the app uses real Supabase authentication instead of the demo account.
 */

console.log('🔐 Clearing demo authentication data...');

try {
  // Script can be run in Node.js environment
  console.log('In Node.js environment - please run this in the browser console instead');
  console.log('Copy and paste the following code into your browser console:');
  console.log(`
  // Clear demo authentication
  localStorage.removeItem('use-local-auth');
  localStorage.removeItem('local-auth-user');
  localStorage.removeItem('auth-ready');
  document.cookie = "use-local-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "local-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  console.log('✅ Demo authentication cleared. Please refresh the page and sign in with your Supabase account.');
  `);
} catch (error) {
  console.error('❌ Error clearing demo authentication:', error);
} 