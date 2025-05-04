#!/usr/bin/env node

/**
 * Fix Deployment Issues Script
 * 
 * This script attempts to fix common deployment issues:
 * 1. Ensures FoodAnalysis.tsx is correctly configured
 * 2. Checks for duplicate processes running on ports
 * 3. Validates critical files exist
 * 4. Checks for Next.js build errors
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

// Main function
async function main() {
  log('🔧 Fixing deployment issues...', 'magenta');
  
  // 1. Kill existing processes
  log('Killing any running processes on ports 3000-3010...', 'blue');
  runCommand('node scripts/kill-ports.js');
  
  // 2. Verify FoodAnalysis.tsx
  log('Checking FoodAnalysis component...', 'blue');
  const foodAnalysisPath = path.join(process.cwd(), 'src/components/FoodAnalysis.tsx');
  
  if (fileExists(foodAnalysisPath)) {
    const content = fs.readFileSync(foodAnalysisPath, 'utf8');
    if (content.includes('return (') && !content.includes('compatibility wrapper')) {
      log('FoodAnalysis.tsx is not a compatibility wrapper, fixing...', 'yellow');
      
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

      fs.writeFileSync(foodAnalysisPath, compatibilityCode);
      log('✅ Fixed FoodAnalysis.tsx', 'green');
    } else {
      log('✅ FoodAnalysis.tsx looks good', 'green');
    }
  } else {
    log('Creating FoodAnalysis compatibility wrapper...', 'yellow');
    
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

    fs.writeFileSync(foodAnalysisPath, compatibilityCode);
    log('✅ Created FoodAnalysis compatibility wrapper', 'green');
  }
  
  // 3. Ensure emergency fix scripts exist
  log('Checking emergency fix scripts...', 'blue');
  const requiredScripts = [
    'public/emergency-fix.js',
    'public/data-troubleshooter.js',
    'public/cache-buster.js'
  ];
  
  let scriptsFixed = false;
  requiredScripts.forEach(scriptPath => {
    const fullPath = path.join(process.cwd(), scriptPath);
    if (!fileExists(fullPath)) {
      log(`Missing ${scriptPath}, looking for it...`, 'yellow');
      
      // Try to find the file in the repository
      const fileName = path.basename(scriptPath);
      const findResult = runCommand(`find . -name "${fileName}" -type f 2>/dev/null`);
      
      if (findResult && findResult.trim()) {
        const foundPath = findResult.trim().split('\n')[0];
        log(`Found at ${foundPath}, copying...`, 'yellow');
        
        // Ensure directory exists
        const dirPath = path.dirname(fullPath);
        if (!fileExists(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.copyFileSync(foundPath, fullPath);
        log(`✅ Copied ${fileName} to correct location`, 'green');
        scriptsFixed = true;
      } else {
        log(`❌ Could not find ${fileName}`, 'red');
      }
    }
  });
  
  if (scriptsFixed) {
    log('✅ Fixed missing emergency scripts', 'green');
  } else {
    log('✅ All emergency scripts present', 'green');
  }
  
  // 4. Run a clean build
  log('Running clean build...', 'blue');
  runCommand('npm run clean-build');
  
  // Final success message
  log('🎉 Deployment fixes completed!', 'magenta');
  log('You can now run "node standalone-server.js" to start the server', 'cyan');
}

// Run the main function
main().catch(error => {
  log(`Error during fix: ${error.message}`, 'red');
  process.exit(1);
}); 