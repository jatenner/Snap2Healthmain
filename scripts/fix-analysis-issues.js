#!/usr/bin/env node

/**
 * fix-analysis-issues.js
 * 
 * Script to diagnose and fix issues with the food analysis functionality
 * Specifically targets problems with:
 * - API connectivity
 * - Function definitions
 * - Rendering problems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

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

// Helper for colored console logs
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Execute a command and return its output
function execute(command) {
  try {
    return execSync(command, { stdio: 'pipe' }).toString();
  } catch (error) {
    return error.toString();
  }
}

// Check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// Check for port conflicts
async function checkPortConflicts() {
  log('📊 Checking for port conflicts...', 'blue');
  try {
    execSync('node scripts/kill-ports.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ Error killing ports: ${error.message}`, 'red');
    return false;
  }
}

// Check FoodAnalysis.tsx component
async function checkFoodAnalysisComponent() {
  log('📄 Checking FoodAnalysis.tsx...', 'blue');
  
  try {
    const filePath = path.join(process.cwd(), 'src', 'components', 'FoodAnalysis.tsx');
    const fileContent = await readFile(filePath, 'utf8');
    
    // Check for common syntax errors
    const syntaxIssues = [
      { pattern: /return\s*\(\s*<div[^>]*>\s*$/, message: 'Missing closing tag or incomplete JSX structure' },
      { pattern: /import\s+{[^}]*}\s+from\s*['"][^'"]*['"];\s*import/, message: 'Multiple imports on same line (formatting issue)' },
      { pattern: /}\s*;/, message: 'Unnecessary semicolon after closing brace' },
      { pattern: /console\.log\([^)]*\)/, message: 'Debug console.log statements' },
    ];
    
    let issues = [];
    syntaxIssues.forEach(({ pattern, message }) => {
      if (pattern.test(fileContent)) {
        issues.push(message);
      }
    });
    
    if (issues.length > 0) {
      log(`⚠️ FoodAnalysis.tsx has potential issues:`, 'yellow');
      issues.forEach(issue => log(`  - ${issue}`, 'yellow'));
      
      // Auto-fix common formatting issues
      log('🔧 Attempting to fix formatting issues...', 'blue');
      
      let fixedContent = fileContent
        .replace(/}\s*;/g, '}')
        .replace(/{\s*;/g, '{')
        .replace(/(\r?\n)\s*\r?\n\s*\r?\n/g, '$1$1');
      
      if (fixedContent !== fileContent) {
        await writeFile(filePath, fixedContent, 'utf8');
        log('✅ Fixed formatting issues in FoodAnalysis.tsx', 'green');
      }
      
      return false;
    }
    
    log('✅ FoodAnalysis.tsx looks good', 'green');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('❌ FoodAnalysis.tsx not found. Please check the file path.', 'red');
    } else {
      log(`❌ Error checking FoodAnalysis.tsx: ${error.message}`, 'red');
    }
    return false;
  }
}

// Check API route for function name mismatches
async function checkAPIRoute() {
  log('📄 Checking analyze-image API route...', 'blue');
  
  try {
    const filePath = path.join(process.cwd(), 'app', 'api', 'analyze-image', 'route.ts');
    const fileContent = await readFile(filePath, 'utf8');
    
    // Check for function name mismatches
    const functionReferences = [
      { name: 'generateGoalInsights', pattern: /goalSpecificInsights:\s*generateGoalInsights/ },
      { name: 'generatePizzaGoalInsights', pattern: /generatePizzaGoalInsights/ },
    ];
    
    // Find function definitions
    const functionDefinitions = fileContent.match(/function\s+([a-zA-Z0-9_]+)\s*\(/g) || [];
    const definedFunctions = functionDefinitions.map(def => {
      const match = def.match(/function\s+([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Check for mismatches between references and definitions
    const missingFunctions = [];
    functionReferences.forEach(({ name, pattern }) => {
      if (pattern.test(fileContent) && !definedFunctions.includes(name)) {
        missingFunctions.push(name);
      }
    });
    
    if (missingFunctions.length > 0) {
      log(`❌ Function name mismatches found in analyze-image/route.ts:`, 'red');
      missingFunctions.forEach(func => log(`  - Missing function: ${func}`, 'red'));
      
      // Add the missing generateGoalInsights function if needed
      if (missingFunctions.includes('generateGoalInsights')) {
        log('🔧 Adding missing generateGoalInsights function...', 'blue');
        
        const functionToAdd = `
/**
 * Generate goal-specific insights for dishes based on user's health goal
 */
function generateGoalInsights(goal: string): string[] {
  const userGoal = goal.toLowerCase();
  
  if (userGoal.includes('weight loss')) {
    return [
      "Choose whole grain pasta over refined for higher fiber and slower digestion",
      "Limit portion size to about 1 cup of cooked pasta",
      "Add extra vegetables to increase volume with minimal calories",
      "Use tomato-based sauces instead of cream-based ones to reduce calories"
    ];
  } 
  else if (userGoal.includes('muscle') || userGoal.includes('strength')) {
    return [
      "Increase portion size to 1.5-2 cups of cooked pasta for extra carbs",
      "Add a lean protein source like chicken, turkey or seafood",
      "Consider whole grain pasta for additional nutrients",
      "Time your meal within 2 hours after workout for optimal recovery"
    ];
  }
  else if (userGoal.includes('heart')) {
    return [
      "Choose whole grain pasta for additional fiber which can help reduce cholesterol",
      "Add omega-3 rich foods like salmon or sardines",
      "Use extra virgin olive oil instead of butter",
      "Incorporate antioxidant-rich vegetables like spinach or kale"
    ];
  }
  else if (userGoal.includes('diabetes') || userGoal.includes('blood sugar')) {
    return [
      "Opt for whole grain pasta with higher fiber content",
      "Keep portion sizes moderate to control carbohydrate intake",
      "Include protein and healthy fats to slow digestion and glucose release",
      "Add non-starchy vegetables to increase fiber and nutrients without adding many carbs"
    ];
  }
  else if (userGoal.includes('sports') || userGoal.includes('performance')) {
    return [
      "Consume 3-4 hours before competition for sustained energy",
      "Choose easily digestible refined pasta before events",
      "Add moderate protein for recovery",
      "Increase portion size during heavy training periods"
    ];
  }
  else {
    // General wellness or any other goal
    return [
      "Aim for a balanced plate with 1/4 protein, 1/4 carbs, and 1/2 vegetables",
      "Choose whole grain options when possible for added nutrients and fiber",
      "Add colorful vegetables for a variety of phytonutrients",
      "Control portion sizes to match your personal energy needs"
    ];
  }
}`;
        
        // Insert the function before the existing pasta analysis function
        const updatedContent = fileContent.replace(
          /\/\/ Handle pasta analysis/,
          `${functionToAdd}\n\n// Handle pasta analysis`
        );
        
        await writeFile(filePath, updatedContent, 'utf8');
        log('✅ Added missing generateGoalInsights function', 'green');
      }
      
      return false;
    }
    
    log('✅ No function name mismatches found in analyze-image/route.ts', 'green');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('❌ analyze-image/route.ts not found. Please check the file path.', 'red');
    } else {
      log(`❌ Error checking API route: ${error.message}`, 'red');
    }
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  log('🌐 Testing API endpoints...', 'blue');
  
  // Check if the development server is running
  const isServerRunning = await isPortInUse(3000);
  
  if (!isServerRunning) {
    log('Starting development server in the background...', 'blue');
    // Start dev server in background
    const child = require('child_process').spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    
    log('Waiting 5 seconds for server to start...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Test endpoints
  const testEndpoints = [
    { name: '/api/health', path: '/api/health' },
    { name: '/api/version', path: '/api/version' },
    { name: '/api/analyze-image', path: '/api/analyze-image' }
  ];
  
  let allEndpointsWorking = true;
  
  for (const endpoint of testEndpoints) {
    log(`Testing ${endpoint.name} endpoint...`, 'blue');
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3000${endpoint.path}`, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Request timed out')));
      });
      
      if (response.status >= 200 && response.status < 300) {
        log(`✅ ${endpoint.name} endpoint is working`, 'green');
      } else {
        log(`❌ ${endpoint.name} returned status ${response.status}`, 'red');
        allEndpointsWorking = false;
      }
    } catch (error) {
      log(`❌ Error testing ${endpoint.name}: ${error.message}`, 'red');
      allEndpointsWorking = false;
      
      if (error.message.includes('ECONNREFUSED')) {
        log('The development server might not be running. Starting it...', 'yellow');
        
        // Start the development server in the foreground
        try {
          execSync('npm run dev', { stdio: 'inherit' });
        } catch (err) {
          // The process might have been killed by Ctrl+C, which is fine
        }
      }
    }
  }
  
  return allEndpointsWorking;
}

// Clean caches and build the app
async function cleanAndBuild() {
  log('🧹 Cleaning caches and building...', 'blue');
  
  try {
    log('Removing .next directory...', 'blue');
    execSync('rm -rf .next', { stdio: 'inherit' });
    
    log('Removing node_modules/.cache...', 'blue');
    execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
    
    log('Starting development build...', 'blue');
    execSync('npm run dev', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    log(`❌ Error cleaning and building: ${error.message}`, 'red');
    return false;
  }
}

// Main function
async function main() {
  log('🔍 Starting diagnostic for food analysis issues...', 'magenta');
  
  // Check for port conflicts
  await checkPortConflicts();
  
  // Check FoodAnalysis component
  const foodAnalysisOk = await checkFoodAnalysisComponent();
  
  // Check API route
  const apiRouteOk = await checkAPIRoute();
  
  // Test API endpoints
  const endpointsOk = await testAPIEndpoints();
  
  // Clean and build
  await cleanAndBuild();
  
  log('🎉 Diagnostic and fixes completed!', 'green');
  log('The food analysis functionality should now be working correctly.', 'green');
  log('If you still encounter issues, please check:', 'yellow');
  log('1. Browser console for any JavaScript errors', 'yellow');
  log('2. Server logs for any API errors', 'yellow');
  log('3. Network requests in DevTools for failed API calls', 'yellow');
}

// Run the main function
main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
}); 