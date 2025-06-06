#!/bin/bash

echo "🧪 Testing Snap2Health Localhost..."
echo "=================================="

# Test basic connectivity
echo "1. Testing API connectivity..."
if curl -s http://localhost:3000/api/ping > /dev/null; then
    echo "   ✅ API server responding"
else
    echo "   ❌ API server not responding"
    exit 1
fi

# Test system status
echo "2. Testing system status..."
STATUS=$(curl -s http://localhost:3000/api/system-status)
if echo "$STATUS" | grep -q '"status":"ok"'; then
    echo "   ✅ System services working"
else
    echo "   ⚠️  Some services may have issues (check manually)"
fi

# Test environment variables
echo "3. Testing environment configuration..."
if echo "$STATUS" | grep -q '"configured":true'; then
    echo "   ✅ Environment variables loaded"
else
    echo "   ❌ Environment variables missing"
fi

# Test main pages
echo "4. Testing main pages..."
PAGES=("/" "/login" "/signup" "/upload")
for page in "${PAGES[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$page | grep -q "200"; then
        echo "   ✅ $page - OK"
    else
        echo "   ❌ $page - Error"
    fi
done

echo ""
echo "🎯 Manual Testing Required:"
echo "   • Sign up/login functionality"  
echo "   • Image upload and analysis"
echo "   • Profile management"
echo "   • Meal history"
echo ""
echo "📱 Test URLs:"
echo "   • Homepage: http://localhost:3000"
echo "   • Login: http://localhost:3000/login"
echo "   • Upload: http://localhost:3000/upload"
echo "   • Profile: http://localhost:3000/profile"
echo ""
echo "🚀 When all tests pass, deploy with:"
echo "   ./scripts/sync-env-to-vercel.sh && vercel --prod" 