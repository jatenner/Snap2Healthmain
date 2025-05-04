#!/usr/bin/env node

/**
 * Vercel Environment Setup Script
 * 
 * This script helps automate the process of setting up environment variables
 * for Vercel deployment by:
 * 1. Reading from local .env files (if they exist)
 * 2. Preparing a command to set environment variables in Vercel
 * 
 * Note: You'll need the Vercel CLI installed and be logged in
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
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Log a colored message to console
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

// Important environment variables that should be set
const recommendedEnvVars = [
  'NEXT_PUBLIC_VERCEL_DEPLOYMENT',
  'NODE_OPTIONS'
];

// Default values for some variables
const defaultValues = {
  'NEXT_PUBLIC_VERCEL_DEPLOYMENT': 'true',
  'NODE_OPTIONS': '--max-old-space-size=4096 --expose-gc'
};

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('npx vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Read environment variables from .env files
function readEnvFiles() {
  const envFiles = [
    '.env.local',
    '.env.development.local',
    '.env.production.local',
    '.env',
    '.env.development',
    '.env.production'
  ];

  const envVars = {};

  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`Reading from ${file}...`, colors.blue);
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const match = trimmedLine.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            envVars[key] = value;
          }
        }
      }
    }
  }

  return envVars;
}

// Generate Vercel env setup commands
function generateVercelCommands(envVars) {
  const missingRequired = [];
  const commands = [];
  const projectName = 'snap2-healthmain'; // Default project name, change if needed
  
  // Check for required variables
  for (const key of requiredEnvVars) {
    if (envVars[key]) {
      commands.push(`npx vercel env add ${key} production "${envVars[key]}"`);
    } else {
      missingRequired.push(key);
    }
  }
  
  // Add recommended variables
  for (const key of recommendedEnvVars) {
    if (envVars[key]) {
      commands.push(`npx vercel env add ${key} production "${envVars[key]}"`);
    } else if (defaultValues[key]) {
      commands.push(`npx vercel env add ${key} production "${defaultValues[key]}"`);
    }
  }
  
  return { commands, missingRequired };
}

// Display the results
function displayResults(commands, missingRequired) {
  log('\n========================================', colors.cyan);
  log('📦 VERCEL ENVIRONMENT SETUP', colors.cyan + colors.bold);
  log('========================================\n', colors.cyan);
  
  if (missingRequired.length > 0) {
    log('⚠️  Missing required environment variables:', colors.yellow);
    for (const key of missingRequired) {
      log(`   - ${key}`, colors.yellow);
    }
    log('\nYou need to set these variables before deploying.\n', colors.yellow);
  }
  
  if (commands.length > 0) {
    log('🚀 Run these commands to set up your Vercel environment:', colors.green);
    log('\n# Make sure you\'re logged in to Vercel first:', colors.cyan);
    log('npx vercel login\n', colors.reset);
    
    log('# Then run these commands:', colors.cyan);
    for (const cmd of commands) {
      log(cmd, colors.reset);
    }
    
    log('\n# Or use this all-in-one command:', colors.cyan);
    log(commands.join(' && '), colors.reset);
  }
  
  log('\n🌐 After setting environment variables, deploy with:', colors.cyan);
  log('npx vercel --prod', colors.reset);
  
  log('\n========================================', colors.cyan);
}

// Main function
function main() {
  log('🔍 Checking Vercel CLI...', colors.blue);
  const cliExists = checkVercelCLI();
  
  if (!cliExists) {
    log('❌ Vercel CLI not found. Install it with:', colors.red);
    log('npm install -g vercel', colors.reset);
    process.exit(1);
  }
  
  log('✅ Vercel CLI is available', colors.green);
  
  log('\n🔍 Looking for environment files...', colors.blue);
  const envVars = readEnvFiles();
  
  if (Object.keys(envVars).length === 0) {
    log('⚠️  No environment variables found in .env files.', colors.yellow);
    log('You will need to set them manually or create a .env.local file.', colors.yellow);
  } else {
    log(`✅ Found ${Object.keys(envVars).length} environment variables`, colors.green);
  }
  
  const { commands, missingRequired } = generateVercelCommands(envVars);
  displayResults(commands, missingRequired);
}

main(); 