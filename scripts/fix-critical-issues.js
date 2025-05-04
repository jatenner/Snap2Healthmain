#!/usr/bin/env node

/**
 * fix-critical-issues.js
 * 
 * A targeted script to fix just the critical issues in the Snap2Health app
 * This script addresses:
 * 1. Syntax errors in the FoodAnalysis.tsx file
 * 2. Function name mismatches in the analyze-image API route
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better readability
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

// Main function
async function main() {
  log('🔧 Starting critical fixes for Snap2Health app...', 'cyan');
  
  // Step 1: Fix FoodAnalysis.tsx
  log('\n📄 Fixing FoodAnalysis.tsx...', 'blue');
  const foodAnalysisPath = path.join(process.cwd(), 'src', 'components', 'FoodAnalysis.tsx');
  
  // Create backup if the file exists
  if (fs.existsSync(foodAnalysisPath)) {
    fs.copyFileSync(foodAnalysisPath, `${foodAnalysisPath}.backup`);
    log('✅ Created backup at FoodAnalysis.tsx.backup', 'green');
  }
  
  // Write the correct content
  const foodAnalysisContent = `'use client';

// This is a clean minimal wrapper that simply imports and exports SimpleFoodAnalysis
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

// Direct assignment without any extra code
const FoodAnalysis = SimpleFoodAnalysis;

// Export both as default and named export for maximum compatibility
export default FoodAnalysis;
export { FoodAnalysis, SimpleFoodAnalysis };
`;
  
  fs.writeFileSync(foodAnalysisPath, foodAnalysisContent);
  log('✅ Fixed FoodAnalysis.tsx', 'green');
  
  // Step 2: Fix analyze-image/route.ts
  log('\n📄 Fixing analyze-image API route...', 'blue');
  const apiRoutePath = path.join(process.cwd(), 'app', 'api', 'analyze-image', 'route.ts');
  
  if (fs.existsSync(apiRoutePath)) {
    const content = fs.readFileSync(apiRoutePath, 'utf8');
    fs.copyFileSync(apiRoutePath, `${apiRoutePath}.backup`);
    
    // Ensure generateGoalInsights function exists
    const hasGoalInsightsFunction = content.includes('function generateGoalInsights');
    
    if (!hasGoalInsightsFunction) {
      log('⚠️ The generateGoalInsights function is missing. Adding it...', 'yellow');
      
      // Find a good place to add the function - after generatePizzaGoalInsights
      const pizzaFunctionEndPos = content.indexOf('function generatePizzaGoalInsights') + 
        content.substring(content.indexOf('function generatePizzaGoalInsights')).indexOf('}');
      
      if (pizzaFunctionEndPos > 0) {
        const functionToAdd = `

/**
 * Generate goal-specific insights for dishes based on user's health goal
 */
function generateGoalInsights(goal: string): string[] {
  switch (goal?.toLowerCase()) {
    case 'weight loss':
      return [
        "Choose whole grain pasta over refined for higher fiber and slower digestion",
        "Limit portion size to about 1 cup of cooked pasta",
        "Add extra vegetables to increase volume with minimal calories",
        "Use tomato-based sauces instead of cream-based ones to reduce calories"
      ];
    case 'muscle gain':
      return [
        "Increase portion size to 1.5-2 cups of cooked pasta for extra carbs",
        "Add a lean protein source like chicken, turkey or seafood",
        "Consider whole grain pasta for additional nutrients",
        "Time your meal within 2 hours after workout for optimal recovery"
      ];
    case 'heart health':
      return [
        "Choose whole grain pasta for additional fiber which can help reduce cholesterol",
        "Add omega-3 rich foods like salmon or sardines",
        "Use extra virgin olive oil instead of butter",
        "Incorporate antioxidant-rich vegetables like spinach or kale"
      ];
    case 'diabetes management':
      return [
        "Opt for whole grain pasta with higher fiber content",
        "Keep portion sizes moderate to control carbohydrate intake",
        "Include protein and healthy fats to slow digestion and glucose release",
        "Add non-starchy vegetables to increase fiber and nutrients without adding many carbs"
      ];
    case 'sports performance':
      return [
        "Consume 3-4 hours before competition for sustained energy",
        "Choose easily digestible refined pasta before events",
        "Add moderate protein for recovery",
        "Increase portion size during heavy training periods"
      ];
    case 'general wellness':
    default:
      return [
        "Aim for a balanced plate with 1/4 protein, 1/4 carbs, and 1/2 vegetables",
        "Choose whole grain options when possible for added nutrients and fiber",
        "Add colorful vegetables for a variety of phytonutrients",
        "Control portion sizes to match your personal energy needs"
      ];
  }
}`;
        
        // Insert the function
        const newContent = content.substring(0, pizzaFunctionEndPos + 1) + 
                          functionToAdd + 
                          content.substring(pizzaFunctionEndPos + 1);
        
        fs.writeFileSync(apiRoutePath, newContent);
        log('✅ Added generateGoalInsights function to analyze-image/route.ts', 'green');
      } else {
        log('❌ Could not find appropriate position to add generateGoalInsights function', 'red');
      }
    } else {
      log('✅ generateGoalInsights function already exists', 'green');
    }
  } else {
    log('❌ analyze-image/route.ts not found', 'red');
  }
  
  // Clean .next directory
  log('\n🧹 Cleaning .next directory...', 'blue');
  if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    try {
      fs.rmdirSync(path.join(process.cwd(), '.next'), { recursive: true });
      log('✅ Removed .next directory', 'green');
    } catch (error) {
      log(`❌ Failed to remove .next directory: ${error.message}`, 'red');
    }
  } else {
    log('⚠️ .next directory does not exist', 'yellow');
  }
  
  log('\n🎉 Critical fixes have been applied!', 'magenta');
  log('Try running the application with: npm run dev\n', 'green');
  log('If you continue to experience issues, try these additional fixes manually:');
  log('1. Kill any processes on port 3000: lsof -ti:3000 | xargs kill -9');
  log('2. Clear node_modules/.cache: rm -rf node_modules/.cache');
  log('3. Run the server on a different port: PORT=3001 npm run dev');
}

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
}); 