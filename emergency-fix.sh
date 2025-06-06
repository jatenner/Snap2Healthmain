#!/bin/bash

# Emergency Fix for Hanging Analysis
echo "🚨 EMERGENCY FIX: Disabling insights temporarily to fix timeout issue"

# Backup the current file
cp app/api/analyze-meal/route.ts app/api/analyze-meal/route.ts.backup

# Replace the hanging insights section with immediate return
sed -i.bak '/Step 6: Generate complete analysis with insights/,/return NextResponse.json(fallbackResponseData, { status: 200 });/c\
    // Step 6: EMERGENCY MODE - Return nutrition data immediately\
    console.log('\''[analyze-meal] ⚡ EMERGENCY MODE: Returning nutrition data immediately'\'');\
    \
    await supabaseAdmin\
      .from('\''meals'\'')\
      .update({\
        insights_status: '\''emergency_mode'\'',\
        updated_at: new Date().toISOString()\
      })\
      .eq('\''id'\'', actualMealId);\
\
    const responseData = {\
      success: true,\
      id: actualMealId,\
      mealId: actualMealId,\
      name: analysisResult?.mealName || analysisResult?.name || '\''Analyzed Meal'\'',\
      calories: analysisResult?.calories || 0,\
      imageUrl: publicUrl,\
      analysis: analysisResult || {},\
      nutrients: analysisResult || {},\
      macronutrients: analysisResult?.macronutrients || [],\
      micronutrients: analysisResult?.micronutrients || [],\
      insights_status: '\''emergency_mode'\'',\
      personalized_insights: null\
    };\
    \
    console.log('\''[analyze-meal] 🎉 EMERGENCY: Fast response sent!'\'');\
    return NextResponse.json(responseData, { status: 200 });' app/api/analyze-meal/route.ts

echo "✅ Emergency fix applied! Your analysis should work in seconds now."
echo "💡 To restore insights later, copy back: app/api/analyze-meal/route.ts.backup" 