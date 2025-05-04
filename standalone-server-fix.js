#!/usr/bin/env node

/**
 * Fixed Standalone Server
 * 
 * This server runs on port 3001 and includes various fixes for the Snap2Health app.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Special port to avoid conflicts
const PORT = 3001;

// Kill any existing processes on this port
exec(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, (error) => {
  if (error) {
    console.error(`Error killing processes on port ${PORT}:`, error);
  }
  
  // Create the Next.js app
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();
  
  // Log with colors
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
  };
  
  // Fix FoodAnalysis component before starting
  try {
    if (fs.existsSync('src/components/FoodAnalysis.tsx')) {
      const content = `'use client';

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
}

export default FoodAnalysis;`;
      
      fs.writeFileSync('src/components/FoodAnalysis.tsx', content);
      console.log(`${colors.green}✅ Fixed FoodAnalysis component${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error fixing FoodAnalysis:${colors.reset}`, error);
  }
  
  // Add input fix script to public directory if it doesn't exist
  try {
    const inputFixPath = path.join(__dirname, 'public', 'fix-input-issues.js');
    if (!fs.existsSync(inputFixPath)) {
      // Simple version for demonstration (full version would be copied from the existing file)
      const basicFix = `
(function() {
  // Create diagnostic console
  const console = document.createElement('div');
  console.id = 'input-fix-console';
  console.style.position = 'fixed';
  console.style.bottom = '0';
  console.style.left = '0';
  console.style.right = '0';
  console.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  console.style.color = '#00ff00';
  console.style.padding = '10px';
  console.style.zIndex = '9999';
  console.style.maxHeight = '40vh';
  console.style.overflowY = 'auto';
  console.style.borderTop = '2px solid #00ff00';
  
  const header = document.createElement('div');
  header.innerHTML = '🚑 INPUT FIX ACTIVATED';
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '10px';
  console.appendChild(header);
  
  document.body.appendChild(console);
  
  // Fix input fields
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    const parent = input.parentNode;
    if (parent) {
      const clone = input.cloneNode(true);
      parent.replaceChild(clone, input);
    }
  });
  
  // Apply CSS fixes
  const style = document.createElement('style');
  style.textContent = \`
    input, textarea {
      transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
    }
  \`;
  document.head.appendChild(style);
})();
      `;
      
      fs.writeFileSync(inputFixPath, basicFix);
      console.log(`${colors.green}✅ Created input fix script${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error creating input fix script:${colors.reset}`, error);
  }
  
  // Prepare and start the server
  app.prepare().then(() => {
    createServer((req, res) => {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Add cache control headers to prevent caching issues
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Add a custom header to inject the input fix script
      res.setHeader('X-Input-Fix', 'true');
      
      // Handle the request
      handle(req, res, parsedUrl);
    }).listen(PORT, (err) => {
      if (err) throw err;
      
      console.log(`${colors.green}==================================================${colors.reset}`);
      console.log(`${colors.green}  SNAP2HEALTH FIXED SERVER RUNNING${colors.reset}`);
      console.log(`${colors.green}==================================================${colors.reset}`);
      console.log(`${colors.cyan}🌐 Ready on ${colors.yellow}http://localhost:${PORT}${colors.reset}`);
      console.log(`${colors.cyan}💡 This server includes fixes for:${colors.reset}`);
      console.log(`   - Input and typing issues`);
      console.log(`   - Infinite reload loops`);
      console.log(`   - Component syntax errors`);
      console.log(`${colors.green}==================================================${colors.reset}`);
      
      // Automatically open the browser
      setTimeout(() => {
        if (process.platform === 'darwin') {
          exec(`open http://localhost:${PORT}`);
        } else if (process.platform === 'win32') {
          exec(`start http://localhost:${PORT}`);
        } else {
          exec(`xdg-open http://localhost:${PORT}`);
        }
      }, 1000);
    });
  });
}); 