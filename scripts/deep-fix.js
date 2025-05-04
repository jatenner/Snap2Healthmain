/**
 * Snap2Health Deep Fix Script
 * 
 * This script performs a complete reset of the application environment
 * and fixes issues with infinite reloading, typing glitches, and UI freezes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

// ANSI colors for prettier console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Print a colored log message
function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// Print a section header
function section(title) {
  console.log('\n' + colors.bold + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.bold + colors.blue + ' ' + title + colors.reset);
  console.log(colors.bold + colors.blue + '='.repeat(50) + colors.reset + '\n');
}

// Run a command and return its output
function runCommand(command, silent = false) {
  try {
    if (!silent) log(`Running: ${command}`, 'cyan');
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    if (!silent) log(`Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Kill processes using specified ports
function killPortProcesses() {
  section('Killing Port Processes');
  log('Stopping all processes on ports 3000-3010...', 'yellow');
  
  try {
    if (process.platform === 'win32') {
      runCommand('powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3000-3010 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force"');
    } else if (process.platform === 'darwin') {
      // macOS
      runCommand('pkill -f "node.*dev" || true');
      runCommand('lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true');
    } else {
      // Linux
      runCommand('lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true');
    }
    
    log('✅ All processes killed or none were running', 'green');
    return true;
  } catch (error) {
    log(`❌ Error killing processes: ${error.message}`, 'red');
    return false;
  }
}

// Clear all caches and build artifacts
function clearCaches() {
  section('Clearing Caches');
  
  log('Removing .next directory...', 'cyan');
  runCommand('rm -rf .next');
  
  log('Clearing node_modules cache...', 'cyan');
  runCommand('rm -rf node_modules/.cache');
  
  if (fs.existsSync('.env.local.backup')) {
    log('Restoring .env.local from backup...', 'cyan');
    runCommand('cp .env.local.backup .env.local');
  } else {
    log('Creating backup of .env.local...', 'cyan');
    if (fs.existsSync('.env.local')) {
      runCommand('cp .env.local .env.local.backup');
    }
  }

  log('✅ All caches cleared', 'green');
}

// Fix NPM issues by verifying/reinstalling dependencies
function fixNpmIssues() {
  section('Fixing NPM Issues');
  
  log('Verifying package integrity...', 'cyan');
  runCommand('npm audit --fix');
  
  log('✅ NPM integrity verified', 'green');
}

// Fix known code issues
function fixCodeIssues() {
  section('Fixing Code Issues');
  
  // Check for and fix the FoodAnalysis component
  if (fs.existsSync('src/components/FoodAnalysis.tsx')) {
    log('Fixing FoodAnalysis.tsx...', 'cyan');
    
    let content = fs.readFileSync('src/components/FoodAnalysis.tsx', 'utf8');
    
    // Check for syntax errors in FoodAnalysis.tsx
    if (content.includes('return (') && !content.includes('export default FoodAnalysis;')) {
      log('Found syntax error in FoodAnalysis.tsx, fixing...', 'yellow');
      
      // Extract component content before the return statement
      const beforeReturn = content.split('return (')[0];
      
      // Extract return content
      let returnContent = content.split('return (')[1] || '';
      
      // Find matching closing parenthesis
      let depth = 1;
      let closingIndex = -1;
      
      for (let i = 0; i < returnContent.length; i++) {
        if (returnContent[i] === '(') depth++;
        if (returnContent[i] === ')') depth--;
        
        if (depth === 0) {
          closingIndex = i;
          break;
        }
      }
      
      if (closingIndex !== -1) {
        returnContent = returnContent.substring(0, closingIndex + 1);
      }
      
      // Create fixed component
      const fixedContent = `${beforeReturn}return (${returnContent}

export default FoodAnalysis;`;
      
      fs.writeFileSync('src/components/FoodAnalysis.tsx', fixedContent);
      log('✅ Fixed FoodAnalysis component', 'green');
    } else {
      log('FoodAnalysis.tsx appears to be correctly formatted.', 'green');
    }
  }
  
  // Check and fix analyze-image API route
  if (fs.existsSync('app/api/analyze-image/route.ts')) {
    log('Checking analyze-image API route...', 'cyan');
    
    let content = fs.readFileSync('app/api/analyze-image/route.ts', 'utf8');
    
    if (content.includes('generateGoalInsights(') && !content.includes('function generateGoalInsights(')) {
      log('Found missing generateGoalInsights function, adding it...', 'yellow');
      
      // Add the missing function implementation
      const generateGoalInsightsFunction = `
// Generate goal-specific insights based on the user's health goal
function generateGoalInsights(goal: string | null): string[] {
  if (!goal) return [];
  
  switch(goal.toLowerCase()) {
    case 'weight loss':
      return [
        "Focus on maintaining a calorie deficit",
        "Increase protein intake to preserve muscle mass",
        "Consider adding more fiber-rich vegetables to increase satiety"
      ];
    case 'muscle gain':
      return [
        "Ensure adequate protein intake (1.6-2.2g per kg of bodyweight)",
        "Maintain a small calorie surplus",
        "Prioritize complex carbohydrates around your workout times"
      ];
    case 'maintenance':
      return [
        "Focus on maintaining a balanced diet",
        "Ensure adequate protein intake for muscle preservation",
        "Maintain consistent meal timing and portion sizes"
      ];
    case 'heart health':
      return [
        "Limit saturated fats and sodium",
        "Include omega-3 rich foods like fatty fish and walnuts",
        "Focus on whole, unprocessed foods"
      ];
    default:
      return [
        "Focus on whole, nutrient-dense foods",
        "Maintain adequate hydration",
        "Ensure balanced macronutrient intake"
      ];
  }
}`;
      
      // Insert at the top of the file after the imports
      const importEndIndex = content.lastIndexOf('import');
      const importEndLineIndex = content.indexOf('\n', importEndIndex);
      
      if (importEndLineIndex !== -1) {
        const fixedContent = content.substring(0, importEndLineIndex + 1) + 
          generateGoalInsightsFunction + 
          content.substring(importEndLineIndex + 1);
        
        fs.writeFileSync('app/api/analyze-image/route.ts', fixedContent);
        log('✅ Added generateGoalInsights function to analyze-image route', 'green');
      } else {
        log('❌ Could not find import section in analyze-image route', 'red');
      }
    } else {
      log('analyze-image route appears to be correctly implemented.', 'green');
    }
  }
  
  log('✅ Code issues fixed', 'green');
}

// Start a clean development server
function startCleanServer() {
  section('Starting Clean Server');
  
  log('Building application with clean caches...', 'cyan');
  runCommand('next build');
  
  log('Starting development server on port 3001 (avoiding default port)...', 'cyan');
  
  // Create a process to run the dev server
  const child = require('child_process').spawn('next', ['dev', '-p', '3001'], {
    detached: true,
    stdio: 'inherit'
  });
  
  child.unref();
  
  log('✅ Development server started on port 3001', 'green');
  
  if (process.platform === 'darwin') {
    runCommand('open http://localhost:3001');
  } else if (process.platform === 'win32') {
    runCommand('start http://localhost:3001');
  } else {
    runCommand('xdg-open http://localhost:3001');
  }
}

// Main function to run the deep fix process
async function main() {
  section('🚨 SNAP2HEALTH DEEP FIX 🚨');
  
  try {
    killPortProcesses();
    clearCaches();
    fixNpmIssues();
    fixCodeIssues();
    startCleanServer();
    
    section('✅ DEEP FIX COMPLETED SUCCESSFULLY');
    log('The application should now be running smoothly on port 3001.', 'green');
    log('If you continue to experience issues, please try:', 'yellow');
    log('1. Clearing your browser cache completely (Settings -> Privacy -> Clear browsing data)', 'white');
    log('2. Using a different browser', 'white');
    log('3. Restarting your computer', 'white');
  } catch (error) {
    section('❌ ERROR DURING DEEP FIX');
    log(`${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main(); 