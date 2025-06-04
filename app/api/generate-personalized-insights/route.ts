import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase admin client for saving insights
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { mealData, userProfile, userGoal, requestType, includeRealLifeScenarios, duringMealAnalysis } = await request.json();

    if (!mealData) {
      return NextResponse.json({ error: 'Meal data is required' }, { status: 400 });
    }

    // Detect if this is an enhanced comprehensive analysis request
    const isComprehensiveAnalysis = requestType === 'comprehensive_analysis' || mealData.enhancedPrompt || mealData.forceComprehensive || duringMealAnalysis;
    
    console.log('[generate-personalized-insights] Request type:', requestType || 'standard');
    console.log('[generate-personalized-insights] Enhanced analysis:', isComprehensiveAnalysis);
    console.log('[generate-personalized-insights] Include real-life scenarios:', includeRealLifeScenarios);
    console.log('[generate-personalized-insights] During meal analysis:', duringMealAnalysis);

    // Use longer timeout for comprehensive analysis
    const analysisTimeout = isComprehensiveAnalysis || duringMealAnalysis ? 60000 : 30000; // 60s for comprehensive, 30s for standard
    
    console.log('[generate-personalized-insights] Using timeout:', analysisTimeout + 'ms');

    // Create enhanced, practical real-life impact prompt
    const createPracticalInsightsPrompt = () => {
      let prompt = '';
      
      if (isComprehensiveAnalysis) {
        // Use the conversational, direct prompt like Joe Rogan/Andrew Huberman style
        prompt = `You are a neuroscientist and performance expert providing a straightforward, practical breakdown of how this meal affects the human body. Write in a conversational, direct style - like you're explaining this to a friend who's curious about the science. Be specific about mechanisms and timing, but keep it engaging and accessible.

**BREAK THIS DOWN INTO CLEAR, PRACTICAL SECTIONS:**

## What's Happening in Your Body Right Now
Start with the immediate physiological response. What happens in the first 30 minutes? How does blood sugar respond? What's your insulin doing? Be specific about the metabolic cascade but explain it in plain terms.

## The Next 2-4 Hours: Energy and Performance
Explain exactly how this meal will affect their energy levels, focus, and physical performance. When will they feel peak energy? Any crashes to expect? How does this translate to real activities like work, exercise, or daily tasks?

## Digestive Reality Check
Tell them what to actually expect digestively. Will they feel bloated? How long until they're hungry again? Any bathroom timing predictions? Be honest about potential discomfort.

## Brain Chemistry and Mood
Explain the neurotransmitter effects in simple terms. How will this affect their mood, focus, and social energy? When do these effects kick in?

## Real-World Performance Windows
Give them specific timing windows for different activities:
- Best time for focused work
- Optimal workout timing
- When to avoid running
- Social energy peaks
- Sleep considerations

## Practical Optimization Tips
End with actionable advice. What would make this meal better? Any timing strategies? Hydration needs? What to pair it with?

**TONE AND STYLE:**
- Conversational and direct - like you're having a conversation
- Use "you" throughout to make it personal
- Avoid flowery language or dramatic metaphors
- Focus on practical, actionable insights
- Include specific timeframes and mechanisms
- Make complex science accessible but accurate
- No need to sound poetic - just be informative and engaging`;
      } else {
        // Standard prompt for direct user requests
        prompt = `Provide a straightforward, practical analysis of how this meal will affect this person's day. Use a conversational, direct style and focus on actionable insights with specific timing and physiological mechanisms.`;
      }
      
      // Add user-specific context
      if (userProfile) {
        prompt += `\n\n**PERSONALIZE THIS FOR:**\n`;
        if (userProfile.age) prompt += `Age: ${userProfile.age} years\n`;
        if (userProfile.gender) prompt += `Gender: ${userProfile.gender}\n`;
        if (userProfile.weight) prompt += `Weight: ${userProfile.weight} ${userProfile.weight_unit || 'lbs'}\n`;
        if (userProfile.height) prompt += `Height: ${userProfile.height} ${userProfile.height_unit || 'inches'}\n`;
        if (userProfile.activity_level || userProfile.activityLevel) prompt += `Activity Level: ${userProfile.activity_level || userProfile.activityLevel}\n`;
        if (userProfile.goal || userProfile.currentGoal) prompt += `Primary Goal: ${userProfile.goal || userProfile.currentGoal}\n`;
        if (userProfile.health_conditions && userProfile.health_conditions.length > 0) {
          prompt += `Health Considerations: ${userProfile.health_conditions.join(', ')}\n`;
        }
      }

      // Add meal context
      prompt += `\n**MEAL BREAKDOWN:**\n`;
      prompt += `Meal: ${mealData.mealName || 'Analyzed Meal'}\n`;
      prompt += `Calories: ${mealData.calories || 'Unknown'}\n`;
      
      if (mealData.macronutrients && Array.isArray(mealData.macronutrients)) {
        prompt += `Macros:\n`;
        mealData.macronutrients.forEach((macro: any) => {
          prompt += `• ${macro.name}: ${macro.amount}${macro.unit}\n`;
        });
      }
      
      if (mealData.micronutrients && Array.isArray(mealData.micronutrients)) {
        prompt += `Key Nutrients: ${mealData.micronutrients.slice(0, 6).map((micro: any) => `${micro.name} (${micro.amount}${micro.unit})`).join(', ')}\n`;
      }

      if (includeRealLifeScenarios || isComprehensiveAnalysis) {
        prompt += `\n\n**COVER THESE REAL-LIFE SCENARIOS:**
        
Be specific about timing and practical effects for:
• 30min, 1hr, 2hr, 4hr post-meal windows
• Sitting/desk work performance
• Standing, walking, physical activity
• Exercise and workout timing
• Digestive comfort and bloating
• Bathroom timing predictions
• Social energy and mood
• Sleep impact if eaten at different times
• Hydration needs
• Next meal timing

Make it practical and actionable - no fluff.`;
      }

      return prompt;
    };

    const prompt = createPracticalInsightsPrompt();

    // Call OpenAI API with enhanced parameters for practical analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a neuroscientist and performance expert who explains complex physiology in an engaging, conversational way. Think Joe Rogan meets Andrew Huberman - you're scientifically accurate but speak like you're talking to a friend who's genuinely curious about how their body works. Be direct, practical, and avoid flowery language. Focus on actionable insights with specific timeframes and mechanisms. Make complex science accessible without dumbing it down."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const insights = completion.choices[0]?.message?.content || '';

    // Save the insights back to the database if we have a real meal ID
    if (mealData.id && mealData.id !== 'temp-id') {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('meals')
          .update({ 
            personalized_insights: insights,
            insights: insights // Also save to the generic insights column
          })
          .eq('id', mealData.id);

        if (updateError) {
          console.error('Error saving insights to database:', updateError);
        } else {
          console.log('Successfully saved insights to database for meal:', mealData.id);
        }
      } catch (dbError) {
        console.error('Database error when saving insights:', dbError);
      }
    } else {
      console.log('[generate-personalized-insights] Skipping database save - temp ID or no ID provided');
    }

    return NextResponse.json({ 
      insights,
      success: true 
    });

  } catch (error) {
    console.error('Error generating personalized insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized insights' },
      { status: 500 }
    );
  }
} 