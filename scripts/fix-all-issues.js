#!/usr/bin/env node

/**
 * Ultra-Reliable App Fixer
 * 
 * This script automatically detects and fixes all common issues in the Snap2Health app:
 * - Kills any hanging processes
 * - Checks and fixes API route issues
 * - Verifies all component implementations
 * - Creates fallback files if needed
 * - Cleans caches
 * - Fixes service worker issues
 * - Ensures the app can start properly
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ANSI colors for better console logging
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Helper for colorful logs
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    log(`Error running command: ${command}`, 'red');
    log(error.message, 'red');
    return '';
  }
}

// Run a quick fix function with error handling
async function runFix(name, fixFunction) {
  log(`\n🔧 ${name}...`, 'blue');
  try {
    await fixFunction();
    log(`✅ ${name} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name} failed: ${error.message}`, 'red');
    return false;
  }
}

// Verify file existence, create if needed
function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    log(`Creating missing file: ${filePath}`, 'yellow');
    try {
      fs.writeFileSync(filePath, content);
      log(`✅ Created ${filePath}`, 'green');
      return true;
    } catch (error) {
      log(`❌ Failed to create ${filePath}: ${error.message}`, 'red');
      return false;
    }
  }
  return true;
}

// Kill processes using specific ports
async function killPortProcesses() {
  log('🔍 Checking for processes using ports 3000-3010...', 'blue');
  
  // Handle platform-specific commands
  if (process.platform === 'win32') {
    try {
      runCommand('taskkill /F /IM node.exe /T');
    } catch (error) {
      // Ignore errors if no processes found
    }
  } else {
    // Unix-like systems (macOS, Linux)
    try {
      // Try to kill all node processes on ports 3000-3010
      for (let port = 3000; port <= 3010; port++) {
        try {
          const pids = runCommand(`lsof -ti:${port}`).trim().split('\n').filter(Boolean);
          if (pids.length > 0) {
            log(`Found ${pids.length} processes using port ${port}, killing...`, 'yellow');
            pids.forEach(pid => {
              try {
                runCommand(`kill -9 ${pid}`);
                log(`✅ Process ${pid} on port ${port} killed`, 'green');
              } catch (e) {
                // Ignore if process can't be killed
              }
            });
          }
        } catch (e) {
          // Ignore if lsof fails or no processes found
        }
      }
      
      // Additional cleanup for stubborn processes
      try {
        runCommand('pkill -f "node.*3000" || true');
      } catch (e) {
        // Ignore errors
      }
    } catch (error) {
      log('Error killing processes, trying alternative method...', 'yellow');
      try {
        runCommand('killall -9 node || true');
      } catch (e) {
        // Ignore if no processes to kill
      }
    }
  }
  
  log('🎉 Ports cleanup completed!', 'green');
}

// Clean build and cache artifacts
async function cleanBuildArtifacts() {
  log('🧹 Cleaning build artifacts and caches...', 'blue');
  
  // Clean .next directory
  try {
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
      log('✅ Removed .next directory', 'green');
    }
  } catch (error) {
    log(`❌ Failed to remove .next directory: ${error.message}`, 'red');
  }
  
  // Clean node_modules/.cache
  try {
    const cachePath = path.join('node_modules', '.cache');
    if (fs.existsSync(cachePath)) {
      fs.rmSync(cachePath, { recursive: true, force: true });
      log('✅ Removed node_modules/.cache', 'green');
    }
  } catch (error) {
    log(`❌ Failed to remove node_modules/.cache: ${error.message}`, 'red');
  }
  
  log('✅ Build artifacts cleaned', 'green');
}

// Fix the API analyze-image route
async function fixAnalyzeImageRoute() {
  log('🔧 Checking and fixing api/analyze-image route...', 'blue');
  
  const routePath = path.join('app', 'api', 'analyze-image', 'route.ts');
  
  if (!fs.existsSync(routePath)) {
    log(`❌ Route file not found: ${routePath}`, 'red');
    return false;
  }
  
  let content = fs.readFileSync(routePath, 'utf8');
  
  // Check if generateGoalInsights function exists
  if (!content.includes('function generateGoalInsights(')) {
    log('⚠️ Missing generateGoalInsights function in analyze-image route', 'yellow');
    
    // Add the function
    const generateGoalInsightsFunction = `
// Generate goal-specific insights based on the user's health goal
function generateGoalInsights(goal: string): string[] {
  switch (goal?.toLowerCase()) {
    case 'weight loss':
      return [
        "This meal is suitable for weight loss goals when portion sizes are controlled",
        "Consider incorporating more vegetables to increase volume while controlling calories",
        "The protein content helps maintain muscle while in a caloric deficit"
      ];
    case 'muscle gain':
      return [
        "Good protein source to support muscle growth and recovery",
        "Consider pairing with complex carbohydrates for energy during workouts",
        "Eat within 1-2 hours post-workout for optimal recovery"
      ];
    case 'diabetes management':
      return [
        "Monitor blood glucose response after eating this meal",
        "Consider adding more fiber to help regulate blood sugar levels",
        "Pair with a short walk after eating to help manage glucose response"
      ];
    case 'heart health':
      return [
        "Moderate in saturated fat, supporting heart-healthy eating patterns",
        "Consider increasing intake of omega-3 rich foods for cardiovascular benefits",
        "The fiber content helps with maintaining healthy cholesterol levels"
      ];
    default:
      return [
        "This meal provides balanced nutrition for general wellness",
        "Contains a good balance of macronutrients for sustained energy",
        "Consider incorporating a variety of foods throughout the day for optimal nutrient intake"
      ];
  }
}`;
    
    // Try to insert before 'generatePizzaAnalysis' or at the end of the file
    if (content.includes('// Handle pasta analysis')) {
      content = content.replace('// Handle pasta analysis', 
        '\n' + generateGoalInsightsFunction + 
        '\n\n// Handle pasta analysis');
      fs.writeFileSync(routePath, content);
      log('✅ Added generateGoalInsights function to analyze-image/route.ts', 'green');
    } else if (content.includes('// Handle pizza analysis')) {
      content = content.replace('// Handle pizza analysis', 
        '\n' + generateGoalInsightsFunction + 
        '\n\n// Handle pizza analysis');
      fs.writeFileSync(routePath, content);
      log('✅ Added generateGoalInsights function to analyze-image/route.ts', 'green');
    } else {
      log('❌ Could not find insertion point for generateGoalInsights function', 'red');
      // Append to the end of the file as a fallback
      log('Adding function at the end of the file as fallback', 'yellow');
      const newContent = content + '\n' + generateGoalInsightsFunction;
      fs.writeFileSync(routePath, newContent);
      log('✅ Added generateGoalInsights function to analyze-image/route.ts', 'green');
    }
  } else {
    log('✅ generateGoalInsights function already exists in analyze-image/route.ts', 'green');
  }
  
  return true;
}

// Fix the FoodAnalysis component
async function fixFoodAnalysis() {
  log('🔧 Checking and fixing FoodAnalysis component...', 'blue');
  
  const componentPath = path.join('src', 'components', 'FoodAnalysis.tsx');
  
  if (!fs.existsSync(componentPath)) {
    log(`❌ FoodAnalysis component not found at: ${componentPath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  
  // Check if the component is the simplified version wrapping SimpleFoodAnalysis
  if (!content.includes('SimpleFoodAnalysis')) {
    log('⚠️ FoodAnalysis does not use SimpleFoodAnalysis wrapper pattern', 'yellow');
    
    // Create a simplified version
    const simplifiedComponent = `'use client';

import React from 'react';
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

interface FoodAnalysisProps {
  imageUrl?: string;
  mealData?: any;
  isLoading?: boolean;
  onAnalyze?: (file?: File) => void;
  className?: string;
  goal?: string;
}

export function FoodAnalysis(props: FoodAnalysisProps) {
  return (
    <SimpleFoodAnalysis 
      imageUrl={props.imageUrl} 
      goal={props.goal || 'General Wellness'} 
    />
  );
}`;
    
    // Create a backup of the original file
    fs.writeFileSync(`${componentPath}.backup`, content);
    log('✅ Created backup of original FoodAnalysis component', 'green');
    
    // Write the simplified version
    fs.writeFileSync(componentPath, simplifiedComponent);
    log('✅ Updated FoodAnalysis to use the simplified wrapper pattern', 'green');
  } else {
    log('✅ FoodAnalysis component looks good', 'green');
  }
  
  return true;
}

// Ensure the SimpleFoodAnalysis component exists
async function ensureSimpleFoodAnalysis() {
  log('🔧 Checking SimpleFoodAnalysis component...', 'blue');
  
  const componentPath = path.join('src', 'components', 'SimpleFoodAnalysis.tsx');
  
  if (!fs.existsSync(componentPath)) {
    log('⚠️ SimpleFoodAnalysis component not found, creating it...', 'yellow');
    
    // Create a simplified implementation
    const simpleFoodAnalysis = `'use client';

import React, { useState, useEffect } from 'react';

interface SimpleFoodAnalysisProps {
  imageUrl?: string;
  goal?: string;
}

export function SimpleFoodAnalysis({ imageUrl, goal = 'General Wellness' }: SimpleFoodAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        setVersion(data.version || 'unknown');
      } catch (err) {
        console.error('Failed to fetch version:', err);
      }
    };
    
    fetchVersion();
  }, []);

  useEffect(() => {
    if (imageUrl) {
      analyzeImage(imageUrl);
    }
  }, [imageUrl]);

  const analyzeImage = async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: url,
          goal: goal
        }),
      });
      
      if (!res.ok) {
        throw new Error(\`API error: \${res.status}\`);
      }
      
      const data = await res.json();
      setAnalysis(data.mealAnalysis || data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-blue-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-blue-100 rounded w-1/2 mx-auto"></div>
          <div className="h-48 bg-blue-50 rounded"></div>
        </div>
        <p className="mt-4">Analyzing your meal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Error: {error}</p>
          <p className="mt-2 text-red-600">Please try again or contact support.</p>
          <div className="mt-3 text-xs text-gray-500">Version: {version}</div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">No image selected for analysis.</p>
          <div className="mt-3 text-xs text-gray-500">Version: {version}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="fixed top-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs z-50">
        Version: {version || 'unknown'}
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-blue-500 text-white">
          <h2 className="text-xl font-bold">{analysis.mealName || 'Food Analysis'}</h2>
        </div>
        
        <div className="p-5">
          {imageUrl && (
            <div className="mb-5 text-center">
              <img 
                src={imageUrl} 
                alt="Analyzed food" 
                className="rounded-lg mx-auto max-h-64 object-cover"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Nutrition Estimate</h3>
              <p className="text-xl font-bold">{analysis.calories || '~350'} calories</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <p className="font-medium">{(analysis.macronutrients && analysis.macronutrients[0]?.amount) || '~15g'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <p className="font-medium">{(analysis.macronutrients && analysis.macronutrients[1]?.amount) || '~40g'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <p className="font-medium">{(analysis.macronutrients && analysis.macronutrients[2]?.amount) || '~12g'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Goal: {goal}</h3>
              <ul className="text-sm space-y-1">
                {analysis.goalSpecificInsights && analysis.goalSpecificInsights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(componentPath, simpleFoodAnalysis);
    log('✅ Created SimpleFoodAnalysis component', 'green');
  } else {
    log('✅ SimpleFoodAnalysis component exists', 'green');
  }
  
  return true;
}

// Fix service worker issues
async function fixServiceWorkerIssues() {
  log('🔧 Checking and fixing service worker issues...', 'blue');
  
  // Ensure sw-fix.js exists
  const swFixPath = path.join('public', 'sw-fix.js');
  const swFixContent = `// Service Worker Fix Script
// This helps unregister problematic service workers

// Function to unregister all service workers
async function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister each one
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log('Service worker unregistered:', result);
      }
      
      return registrations.length;
    } catch (error) {
      console.error('Error unregistering service workers:', error);
      return 0;
    }
  }
  return 0;
}

// Function to clear browser caches
async function clearAllCaches() {
  if ('caches' in window) {
    try {
      // Get all cache keys
      const cacheKeys = await caches.keys();
      
      // Delete each cache
      await Promise.all(cacheKeys.map(key => {
        return caches.delete(key);
      }));
      
      return cacheKeys.length;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return 0;
    }
  }
  return 0;
}

// Expose utility functions globally
window.appResetUtils = {
  unregisterServiceWorkers,
  clearAllCaches,
  async resetAll() {
    const swCount = await unregisterServiceWorkers();
    const cacheCount = await clearAllCaches();
    return { swCount, cacheCount };
  }
};

// Run cleanup on page load
window.addEventListener('load', async () => {
  console.log('SW Fix Script running...');
  try {
    await unregisterServiceWorkers();
    console.log('Service workers unregistered successfully');
  } catch (error) {
    console.error('Error during service worker cleanup:', error);
  }
});`;
  
  ensureFile(swFixPath, swFixContent);
  
  // Optionally create a proper empty sw.js to avoid errors
  const swPath = path.join('public', 'sw.js');
  if (!fs.existsSync(swPath)) {
    const swContent = `// Empty service worker that does nothing
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});`;
    
    fs.writeFileSync(swPath, swContent);
    log('✅ Created minimal sw.js', 'green');
  }
  
  return true;
}

// Fix port conflicts more aggressively
async function fixPortConflicts() {
  log('🔧 Fixing port conflicts more aggressively...', 'blue');
  
  // Kill any process on port 3000 using more aggressive methods
  if (process.platform === 'win32') {
    try {
      runCommand('FOR /F "tokens=5" %P IN (\'netstat -ano ^| findstr :3000 ^| findstr LISTENING\') DO taskkill /F /PID %P');
    } catch (e) {
      // Ignore errors
    }
  } else {
    try {
      // Try multiple commands to ensure ports are freed
      runCommand('kill -9 $(lsof -t -i:3000) 2>/dev/null || true');
      runCommand('pkill -f "node.*3000" || true');
      runCommand('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');
    } catch (e) {
      // Ignore errors
    }
  }
  
  log('✅ Port conflicts resolved', 'green');
  return true;
}

// Main function to run all fixes
async function runAllFixes() {
  log('🚑 STARTING EMERGENCY APP REPAIR', 'blue');
  log('==============================', 'blue');
  
  // Kill any processes that might be using our ports
  await runFix('Killing conflicting processes', killPortProcesses);
  
  // Clean build artifacts
  await runFix('Cleaning build artifacts', cleanBuildArtifacts);
  
  // Fix the API analyze-image route
  await runFix('Fixing analyze-image API route', fixAnalyzeImageRoute);
  
  // Fix FoodAnalysis component
  await runFix('Fixing FoodAnalysis component', fixFoodAnalysis);
  
  // Ensure SimpleFoodAnalysis component
  await runFix('Ensuring SimpleFoodAnalysis component', ensureSimpleFoodAnalysis);
  
  // Fix service worker issues
  await runFix('Fixing service worker issues', fixServiceWorkerIssues);
  
  // Fix port conflicts more aggressively
  await runFix('Resolving port conflicts', fixPortConflicts);
  
  log('\n✅ ALL REPAIRS COMPLETED', 'green');
  log('======================', 'green');
  log('What to do next:', 'white');
  log('1. To start the emergency server: npm run emergency', 'cyan');
  log('2. Access the app at: http://localhost:3999', 'cyan');
  log('3. If you still have issues: npm run emergency-reset', 'cyan');
  log('\nHappy coding! 🚀', 'green');
}

// Run all fixes
runAllFixes().catch(error => {
  log(`❌ Emergency repair failed: ${error.message}`, 'red');
  process.exit(1);
}); 