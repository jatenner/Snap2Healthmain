#!/bin/bash

# Snap2Health Vercel Deployment Script
# This script validates the build and deploys to Vercel with proper error handling

set -e  # Exit on any error

echo "🚀 Starting Snap2Health Vercel Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Validate critical files exist
echo "📋 Validating project structure..."

critical_files=(
    "app/lib/supabase/client.ts"
    "app/lib/supabase/server.ts"
    "tsconfig.json" 
    "next.config.js"
    "package.json"
)

for file in "${critical_files[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

# 2. Validate import resolution
echo "🔍 Validating import resolution..."
if node scripts/validate-imports.js; then
    print_status "All @/ imports are valid"
else
    print_error "Import validation failed"
    exit 1
fi

# 3. Clean and reinstall dependencies
echo "📦 Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# 4. Local build test
echo "🏗️ Testing local build..."
if npm run build; then
    print_status "Local build successful"
else
    print_error "Local build failed - fix issues before deploying"
    exit 1
fi

# 5. Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next

# 6. Deploy to Vercel
echo "☁️ Deploying to Vercel..."
if npx vercel --prod --force; then
    print_status "Deployment successful!"
    echo "🎉 Your app should be available at your Vercel domain"
else
    print_error "Deployment failed"
    echo "💡 Try running 'npx vercel logs' to see deployment logs"
    exit 1
fi

echo "✨ Deployment complete!" 