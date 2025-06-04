#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Validating @/ imports...\n');

// Get all TypeScript files in the app directory
const files = glob.sync('app/**/*.{ts,tsx}', { cwd: process.cwd() });

const unresolvedImports = [];
const validImports = [];

// Load tsconfig to understand path mapping
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
let tsconfig;
try {
  tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not read tsconfig.json');
  process.exit(1);
}

const baseUrl = tsconfig.compilerOptions?.baseUrl || '.';
const paths = tsconfig.compilerOptions?.paths || {};

function resolveAlias(importPath) {
  for (const [alias, targets] of Object.entries(paths)) {
    const aliasPattern = alias.replace('*', '');
    if (importPath.startsWith(aliasPattern)) {
      const remaining = importPath.slice(aliasPattern.length);
      for (const target of targets) {
        const targetPath = target.replace('*', remaining);
        return path.resolve(baseUrl, targetPath);
      }
    }
  }
  return null;
}

function checkFileExists(filePath) {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  // Check exact path first
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  
  // Try with extensions
  for (const ext of extensions) {
    const withExt = filePath + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }
  
  // Try index files
  for (const ext of extensions) {
    const indexFile = path.join(filePath, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
  }
  
  return null;
}

// Process each file
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, lineNumber) => {
    // Match import statements with @/ paths
    const importMatch = line.match(/import.*from\s+['"`](@\/[^'"`]+)['"`]/);
    if (importMatch) {
      const importPath = importMatch[1];
      const resolvedPath = resolveAlias(importPath);
      
      if (resolvedPath) {
        const actualFile = checkFileExists(resolvedPath);
        if (actualFile) {
          validImports.push({
            file,
            line: lineNumber + 1,
            import: importPath,
            resolvedTo: actualFile
          });
        } else {
          unresolvedImports.push({
            file,
            line: lineNumber + 1,
            import: importPath,
            attempted: resolvedPath
          });
        }
      } else {
        unresolvedImports.push({
          file,
          line: lineNumber + 1,
          import: importPath,
          attempted: 'No alias mapping found'
        });
      }
    }
  });
});

// Report results
console.log(`✅ Valid imports: ${validImports.length}`);
console.log(`❌ Unresolved imports: ${unresolvedImports.length}\n`);

if (unresolvedImports.length > 0) {
  console.log('🚨 UNRESOLVED IMPORTS:');
  unresolvedImports.forEach(item => {
    console.log(`   ${item.file}:${item.line}`);
    console.log(`     Import: ${item.import}`);
    console.log(`     Attempted: ${item.attempted}`);
    console.log('');
  });
  
  process.exit(1);
} else {
  console.log('🎉 All @/ imports are valid!');
  process.exit(0);
} 