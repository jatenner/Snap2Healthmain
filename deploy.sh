#!/bin/bash

# Snap2Health Deployment Script
# This script prepares and deploys your working application to production

echo "🚀 Starting Snap2Health Deployment Process..."

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "clean-production" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'clean-production'"
    echo "Switching to clean-production branch..."
    git checkout clean-production
fi

# Test the build locally first
echo "🔍 Testing production build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Add all changes
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Production deployment: Working logo, upload, and meal analysis"

# Push to repository
echo "📤 Pushing to GitHub..."
git push origin clean-production

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    exit 1
fi

echo "✅ Successfully pushed to GitHub!"

# Instructions for Vercel
echo ""
echo "🎯 Next Steps for Vercel Deployment:"
echo "1. Go to vercel.com and import your GitHub repository"
echo "2. Select the 'clean-production' branch"
echo "3. Add these environment variables in Vercel:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - OPENAI_API_KEY"
echo "4. Click Deploy!"
echo ""
echo "📋 All deployment files created:"
echo "   ✅ .env.example"
echo "   ✅ vercel.json" 
echo "   ✅ README.deployment.md"
echo "   ✅ deploy.sh"
echo ""
echo "🎉 Your application is ready for production deployment!" 