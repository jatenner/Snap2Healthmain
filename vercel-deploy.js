#!/usr/bin/env node

/**
 * Vercel Deployment Script for Snap2Health
 * 
 * This script prepares the app for deployment to Vercel:
 * 1. Validates all component files
 * 2. Ensures dynamic API routes are correctly set up
 * 3. Updates next.config.js with proper settings
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Run a command
function runCommand(command) {
  try {
    log(`> ${command}`, 'blue');
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`Error executing command: ${command}`, 'red');
    log(error.message, 'red');
    return null;
  }
}

// Validate FoodAnalysis.tsx
function validateFoodAnalysis() {
  const filePath = path.join(process.cwd(), 'src', 'components', 'FoodAnalysis.tsx');
  
  log('Checking FoodAnalysis component...', 'cyan');
  
  if (!fileExists(filePath)) {
    log('FoodAnalysis.tsx not found, creating it...', 'yellow');
    
    // Create minimal wrapper component
    const content = `'use client';

// This file is a compatibility wrapper that re-exports SimpleFoodAnalysis
// This ensures that any imports of FoodAnalysis still work
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

/**
 * @deprecated Use SimpleFoodAnalysis instead
 */
const FoodAnalysis = SimpleFoodAnalysis;

export default FoodAnalysis;
export { FoodAnalysis };`;
    
    fs.writeFileSync(filePath, content, 'utf8');
    log('Created FoodAnalysis.tsx wrapper component', 'green');
  } else {
    // Check if file has correct content
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('import { SimpleFoodAnalysis }') || content.length > 500) {
      log('FoodAnalysis.tsx seems corrupted, fixing...', 'yellow');
      
      // Backup the file
      fs.writeFileSync(`${filePath}.bak`, content, 'utf8');
      
      // Create minimal wrapper component
      const fixedContent = `'use client';

// This file is a compatibility wrapper that re-exports SimpleFoodAnalysis
// This ensures that any imports of FoodAnalysis still work
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

/**
 * @deprecated Use SimpleFoodAnalysis instead
 */
const FoodAnalysis = SimpleFoodAnalysis;

export default FoodAnalysis;
export { FoodAnalysis };`;
      
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      log('Fixed FoodAnalysis.tsx wrapper component', 'green');
    } else {
      log('FoodAnalysis.tsx looks good', 'green');
    }
  }
}

// Update next.config.js with proper settings
function updateNextConfig() {
  const filePath = path.join(process.cwd(), 'next.config.js');
  
  log('Updating next.config.js...', 'cyan');
  
  if (!fileExists(filePath)) {
    log('next.config.js not found!', 'red');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Create an updated config with proper settings
  const updatedConfig = `/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  images: {
    domains: ['localhost', 'snap2health.com', 'www.snap2health.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;
  
  // Write the updated config
  fs.writeFileSync(filePath, updatedConfig, 'utf8');
  log('Updated next.config.js with optimized settings', 'green');
}

// Ensure all API routes are dynamic
function validateApiRoutes() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  if (!fileExists(apiDir)) {
    log('API directory not found', 'yellow');
    return;
  }
  
  log('Validating API routes...', 'cyan');
  
  const requireDynamicRoutes = [
    'meal-history',
    'meals',
    'test-meal',
    'upload-image',
    'analyze-image',
  ];
  
  requireDynamicRoutes.forEach(route => {
    const routeDir = path.join(apiDir, route);
    if (fileExists(routeDir)) {
      const routeFile = path.join(routeDir, 'route.ts');
      if (fileExists(routeFile)) {
        let content = fs.readFileSync(routeFile, 'utf8');
        
        // Check if dynamic flag already exists
        if (!content.includes('export const dynamic =')) {
          // Add at the beginning of the file, but after the imports
          const imports = content.match(/^import.*?[\r\n]+/gm);
          if (imports && imports.length) {
            // Find the last import statement
            const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length;
            const beforeImports = content.substring(0, lastImportIndex);
            const afterImports = content.substring(lastImportIndex);
            
            // Insert the dynamic export after the imports
            content = beforeImports + '\n// Explicitly mark this route as dynamic to prevent build errors\nexport const dynamic = "force-dynamic";\n' + afterImports;
          } else {
            // No imports found, add it at the top with a warning
            content = '// Explicitly mark this route as dynamic to prevent build errors\nexport const dynamic = "force-dynamic";\n\n' + content;
          }
          
          fs.writeFileSync(routeFile, content, 'utf8');
          log(`Added dynamic flag to ${route} API route`, 'green');
        } else if (content.match(/^export const dynamic =/m)) {
          // If there's a dynamic flag at the beginning of a line before imports
          // Fix it by moving it after imports
          if (content.indexOf('export const dynamic =') < content.indexOf('import ')) {
            log(`Fixing dynamic flag position in ${route} API route`, 'yellow');
            
            // Remove the existing export const dynamic line
            content = content.replace(/^export const dynamic = .*?[\r\n]+/m, '');
            
            // Find the last import statement
            const imports = content.match(/^import.*?[\r\n]+/gm);
            if (imports && imports.length) {
              const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length;
              const beforeImports = content.substring(0, lastImportIndex);
              const afterImports = content.substring(lastImportIndex);
              
              // Insert the dynamic export after the imports
              content = beforeImports + '\n// Explicitly mark this route as dynamic to prevent build errors\nexport const dynamic = "force-dynamic";\n' + afterImports;
            }
            
            fs.writeFileSync(routeFile, content, 'utf8');
            log(`Fixed dynamic flag in ${route} API route`, 'green');
          }
        }
      }
    }
  });
  
  log('API routes validation complete', 'green');
}

// Main function
async function main() {
  log('🚀 Starting Vercel deployment preparation...', 'magenta');
  
  // Validate core files
  validateFoodAnalysis();
  
  // Update Next.js config
  updateNextConfig();
  
  // Validate API routes
  validateApiRoutes();
  
  // Build the app
  log('Building the application...', 'cyan');
  runCommand('npm run clean-build');
  
  log('✅ Deployment preparation complete!', 'green');
  log('You can now deploy to Vercel using:', 'green');
  log('vercel --prod', 'yellow');
}

// Run the script
main().catch(error => {
  log('Error during deployment preparation:', 'red');
  log(error.message, 'red');
  process.exit(1);
}); 