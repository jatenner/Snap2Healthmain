#!/bin/bash

echo "🚀 Deploying Snap2Health to Production..."
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if environment variables exist
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    exit 1
fi

echo "📋 Syncing environment variables to Vercel..."
./scripts/sync-env-to-vercel.sh

echo "🏗️  Building and deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is now live on Vercel"
echo ""
echo "📝 Don't forget to:"
echo "   • Update NEXTAUTH_URL to your Vercel domain"
echo "   • Test the production deployment"
echo "   • Monitor logs for any issues" 