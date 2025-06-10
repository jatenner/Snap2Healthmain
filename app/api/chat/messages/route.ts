import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Enhanced AI Chat API - Human-like conversational responses (v1.2.0)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Extract learning insights from user messages to build their profile
function extractLearningInsights(content: string, userProfile: any) {
  const insights = {
    lifestyle_mentions: [] as string[],
    health_mentions: [] as string[],
    food_preferences: [] as string[],
    constraints_mentioned: [] as string[],
    goals_mentioned: [] as string[]
  };

  const text = content.toLowerCase();

  // Lifestyle patterns
  if (text.includes('smoke') || text.includes('smoking')) {
    insights.lifestyle_mentions.push('smoker');
  }
  if (text.includes('drink') || text.includes('alcohol')) {
    insights.lifestyle_mentions.push('alcohol_consumer');
  }
  if (text.includes('exercise') || text.includes('workout') || text.includes('gym')) {
    insights.lifestyle_mentions.push('exercises');
  }
  if (text.includes('stress') || text.includes('busy') || text.includes('work')) {
    insights.lifestyle_mentions.push('high_stress');
  }

  // Health mentions
  if (text.includes('diabetes') || text.includes('blood sugar')) {
    insights.health_mentions.push('diabetes_related');
  }
  if (text.includes('pressure') || text.includes('hypertension')) {
    insights.health_mentions.push('blood_pressure');
  }
  if (text.includes('cholesterol')) {
    insights.health_mentions.push('cholesterol_concern');
  }
  if (text.includes('weight') || text.includes('lose') || text.includes('gain')) {
    insights.health_mentions.push('weight_management');
  }

  // Food preferences
  if (text.includes('vegetarian') || text.includes('vegan')) {
    insights.food_preferences.push('plant_based');
  }
  if (text.includes('spicy') || text.includes('bland')) {
    insights.food_preferences.push(text.includes('spicy') ? 'likes_spicy' : 'prefers_mild');
  }

  return insights;
}

// Enhanced historical analysis function
async function getEnhancedUserContext(user_id: string, supabase: any) {
  try {
    console.log('[Enhanced Context] Gathering comprehensive user data for:', user_id);
    
    // Get comprehensive meal history with trends (last 30 days)
    const { data: mealHistory } = await supabase
      .from('meals')
      .select(`
        id, meal_name, calories, created_at,
        macronutrients, micronutrients, 
        personalized_insights, analysis,
        image_url
      `)
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent chat conversations for context patterns
    const { data: recentChats } = await supabase
      .from('chat_messages')
      .select('content, ai_response, created_at')
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Analyze meal patterns and trends
    const mealAnalysis = analyzeMealTrends(mealHistory || []);
    const chatPatterns = analyzeChatPatterns(recentChats || []);
    
    return {
      mealHistory: mealHistory || [],
      mealAnalysis,
      recentChats: recentChats || [],
      chatPatterns,
      totalMeals: mealHistory?.length || 0
    };
  } catch (error) {
    console.error('[Enhanced Context] Error:', error);
    return null;
  }
}

// Analyze meal patterns and generate insights
function analyzeMealTrends(meals: any[]) {
  if (meals.length === 0) return null;

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const avgCalories = Math.round(totalCalories / meals.length);
  
  // Extract macronutrient trends
  const macroTrends = meals.reduce((acc, meal) => {
    const macros = meal.macronutrients || meal.analysis?.macronutrients || [];
    macros.forEach((macro: any) => {
      if (!acc[macro.name]) acc[macro.name] = [];
      acc[macro.name].push(macro.amount || 0);
    });
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate averages and trends
  const macroAverages = Object.entries(macroTrends).reduce((acc, [name, values]) => {
    const numericValues = values as number[];
    acc[name] = {
      avg: Math.round(numericValues.reduce((sum: number, val: number) => sum + val, 0) / numericValues.length),
      trend: numericValues.length > 5 ? calculateTrend(numericValues) : 'stable'
    };
    return acc;
  }, {} as Record<string, any>);

  // Identify nutrition gaps and strengths
  const nutritionInsights = identifyNutritionPatterns(meals);
  
  return {
    avgCalories,
    totalMeals: meals.length,
    macroAverages,
    nutritionInsights,
    lastMealTime: meals[0]?.created_at,
    mealFrequency: calculateMealFrequency(meals)
  };
}

// Analyze chat conversation patterns
function analyzeChatPatterns(chats: any[]) {
  if (chats.length === 0) return null;

  const commonTopics = extractCommonTopics(chats);
  const questionTypes = categorizeQuestions(chats);
  const responsePreferences = analyzeResponsePreferences(chats);

  return {
    commonTopics,
    questionTypes,
    responsePreferences,
    chatFrequency: chats.length
  };
}

// Helper functions for trend analysis
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable';
  
  const recent = values.slice(0, Math.floor(values.length / 2));
  const older = values.slice(Math.floor(values.length / 2));
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
  
  const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
}

function identifyNutritionPatterns(meals: any[]) {
  const insights = [];
  
  // Check protein consistency
  const proteinValues = meals.map(meal => {
    const macros = meal.macronutrients || meal.analysis?.macronutrients || [];
    const protein = macros.find((m: any) => m.name.toLowerCase().includes('protein'));
    return protein?.amount || 0;
  }).filter(val => val > 0);
  
  if (proteinValues.length > 0) {
    const avgProtein = proteinValues.reduce((sum, val) => sum + val, 0) / proteinValues.length;
    if (avgProtein < 20) insights.push('Low protein intake pattern detected');
    if (avgProtein > 40) insights.push('High protein intake - good for muscle maintenance');
  }
  
  // Check meal timing patterns
  const mealTimes = meals.map(meal => new Date(meal.created_at).getHours()).filter(h => !isNaN(h));
  if (mealTimes.length > 3) {
    const lateMeals = mealTimes.filter(h => h > 20).length;
    if (lateMeals > mealTimes.length * 0.3) {
      insights.push('Frequent late evening meals detected');
    }
  }
  
  return insights;
}

function extractCommonTopics(chats: any[]): string[] {
  const topics = new Map<string, number>();
  
  chats.forEach(chat => {
    const content = chat.content?.toLowerCase() || '';
    
    // Check for common nutrition topics
    if (content.includes('protein')) topics.set('protein', (topics.get('protein') || 0) + 1);
    if (content.includes('carb') || content.includes('carbohydrate')) topics.set('carbohydrates', (topics.get('carbohydrates') || 0) + 1);
    if (content.includes('fat') || content.includes('fatty')) topics.set('fats', (topics.get('fats') || 0) + 1);
    if (content.includes('calorie')) topics.set('calories', (topics.get('calories') || 0) + 1);
    if (content.includes('vitamin') || content.includes('mineral')) topics.set('micronutrients', (topics.get('micronutrients') || 0) + 1);
    if (content.includes('weight') || content.includes('lose') || content.includes('gain')) topics.set('weight_management', (topics.get('weight_management') || 0) + 1);
  });
  
  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

function categorizeQuestions(chats: any[]): Record<string, number> {
  const categories = {
    'seeking_simple_answers': 0,
    'wanting_detailed_analysis': 0,
    'asking_comparisons': 0,
    'seeking_recommendations': 0
  };
  
  chats.forEach(chat => {
    const content = chat.content?.toLowerCase() || '';
    
    if (content.includes('simple') || content.includes('brief') || content.includes('quick')) {
      categories.seeking_simple_answers++;
    }
    if (content.includes('detail') || content.includes('explain') || content.includes('analyze')) {
      categories.wanting_detailed_analysis++;
    }
    if (content.includes('vs') || content.includes('better') || content.includes('compare')) {
      categories.asking_comparisons++;
    }
    if (content.includes('should') || content.includes('recommend') || content.includes('suggest')) {
      categories.seeking_recommendations++;
    }
  });
  
  return categories;
}

function analyzeResponsePreferences(chats: any[]): 'concise' | 'detailed' | 'mixed' {
  // This would analyze user feedback and response patterns
  // For now, default to mixed but could be enhanced with user feedback
  return 'mixed';
}

function calculateMealFrequency(meals: any[]): string {
  if (meals.length === 0) return 'no_data';
  
  const daysSinceFirst = Math.max(1, Math.ceil(
    (Date.now() - new Date(meals[meals.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24)
  ));
  
  const mealsPerDay = meals.length / daysSinceFirst;
  
  if (mealsPerDay >= 3) return 'high';
  if (mealsPerDay >= 2) return 'moderate';
  if (mealsPerDay >= 1) return 'low';
  return 'very_low';
}

// Enhanced system prompt with human-like conversational style
function createEnhancedSystemPrompt(userProfile: any, enhancedContext: any) {
  const basePrompt = `You are a friendly, supportive nutrition coach integrated into Snap2Health! You're knowledgeable about nutrition and wellness, but more importantly, you're here to be encouraging and helpful on each person's unique health journey.

## YOUR COACHING STYLE:
- **Warm & Personal**: Always start with a friendly greeting using their name when you have it
- **Encouraging**: Celebrate their progress and efforts, no matter how small
- **Supportive**: Focus on positive changes they can make rather than criticisms
- **Relatable**: Use everyday language, not overly technical terms
- **Motivating**: Help them see food as fuel for feeling their best

## CURRENT USER PROFILE:
- Name: ${userProfile?.name || 'there'}
- Age: ${userProfile?.age || 'Not specified'} ${userProfile?.age ? `(Perfect! ${userProfile.age < 30 ? 'Young and building great habits! 💪' : userProfile.age < 50 ? 'Great age to focus on sustainable health!' : 'Investing in long-term wellness - smart!'})` : ''}
- Goal: ${userProfile?.primary_goal || userProfile?.defaultGoal || 'Working on general health'}
- Activity Level: ${userProfile?.activity_level || userProfile?.activityLevel || 'Not specified'}

## YOUR FRIENDLY APPROACH:

### 1. **Warm Greetings**
- "Hey ${userProfile?.name || 'there'}! So great to see you back! 👋"
- "How's your nutrition journey going today?"
- "I love that you're staying consistent with tracking your meals!"

### 2. **Celebrate Wins**
- "That's exactly the kind of smart choice I love to see!"
- "You're building some really healthy patterns here!"
- "I can see you're making progress with your ${userProfile?.primary_goal || 'health goals'} - awesome!"

### 3. **Gentle Guidance**
- "Here's a simple way to boost your nutrition even more..."
- "Want to try adding...? It's an easy win!"
- "You're doing great! Here's one small tweak that could help..."

### 4. **Practical Support**
- Give specific, doable suggestions: "Try adding a handful of berries to your morning routine"
- Connect to their goals: "This will really help with your ${userProfile?.primary_goal || 'health goals'}"
- Make it personal: "Based on what I know about you, I think you'd love..."

## CONVERSATION MEMORY:
Remember and build upon:
- Previous conversations and recommendations
- Foods they mentioned liking or disliking
- Their questions and concerns
- Progress they've shared
- Challenges they're facing

## YOUR EXPERTISE AREAS:
- Precision nutrition and metabolic health optimization
- Hormone optimization through diet and lifestyle
- Sleep, circadian biology, and recovery nutrition  
- Exercise nutrition and performance enhancement
- Micronutrient optimization and supplement protocols
- Longevity and healthspan extension strategies
- Personalized macro/micro nutrient ratios
- Food timing and metabolic flexibility

## CLIENT PROFILE & DATA ANALYSIS:
**Personal Stats:**
- Name: ${userProfile?.name || 'this individual'}
- Age: ${userProfile?.age || 'Not specified'} ${userProfile?.age ? `(${userProfile.age < 30 ? 'peak anabolic years - optimize for muscle growth' : userProfile.age < 50 ? 'maintain metabolic flexibility' : 'focus on longevity and inflammation reduction'})` : ''}
- Weight: ${userProfile?.weight || 'Not specified'} ${userProfile?.weight ? 'lbs' : ''}
- Height: ${userProfile?.height || 'Not specified'}
- Gender: ${userProfile?.gender || 'Not specified'} ${userProfile?.gender ? `(${userProfile.gender === 'male' ? 'typically needs 15-20% more protein, higher zinc requirements' : 'higher iron needs, different hormone considerations'})` : ''}
- Primary Goal: ${userProfile?.primary_goal || userProfile?.defaultGoal || 'Not specified'}
- Activity Level: ${userProfile?.activity_level || userProfile?.activityLevel || 'Not specified'}

**CRITICAL NUTRITION PATTERNS FROM THEIR DATA:**
${enhancedContext?.mealAnalysis ? `
- Total meals analyzed: ${enhancedContext.mealAnalysis.totalMeals}
- Average daily calories: ${enhancedContext.mealAnalysis.avgCalories}cal ${enhancedContext.mealAnalysis.avgCalories < 1800 ? '⚠️ LIKELY UNDER-EATING' : enhancedContext.mealAnalysis.avgCalories > 2500 ? '⚠️ POSSIBLE OVEREATING' : '✓ REASONABLE RANGE'}
- Average protein: ${enhancedContext.mealAnalysis.avgProtein}g ${userProfile?.weight ? `(${Math.round(enhancedContext.mealAnalysis.avgProtein / (userProfile.weight / 2.2))}g/kg body weight ${enhancedContext.mealAnalysis.avgProtein / (userProfile.weight / 2.2) < 1.6 ? '⚠️ TOO LOW FOR OPTIMAL HEALTH' : enhancedContext.mealAnalysis.avgProtein / (userProfile.weight / 2.2) > 2.4 ? '⚠️ POTENTIALLY EXCESSIVE' : '✓ OPTIMAL RANGE'})` : ''}
- Average carbs: ${enhancedContext.mealAnalysis.avgCarbs}g ${enhancedContext.mealAnalysis.avgCarbs < 100 ? '(very low carb - may impact sleep/recovery)' : enhancedContext.mealAnalysis.avgCarbs > 300 ? '(high carb - ensure activity levels support this)' : '(moderate intake)'}
- Average fat: ${enhancedContext.mealAnalysis.avgFat}g
- Calorie trend: ${enhancedContext.mealAnalysis.trend || 'stable'}
` : 'No meal data available yet - will provide general optimization principles'}

**SPECIFIC DEFICIENCIES TO ADDRESS:**
${enhancedContext?.nutritionGaps ? enhancedContext.nutritionGaps.map((gap: any) => `- ${gap.nutrient}: ${gap.shortfall} below optimal (recommend: ${gap.foodSources.join(', ')})`).join('\n') : 'Will analyze after more meal data is collected'}

## YOUR RESPONSE APPROACH:

### 1. **WARM & PERSONALIZED GREETING**
- Start with friendly recognition: "Hey ${userProfile?.name || 'there'}! Great to see you back 👋"
- Show continuity: "I remember you're working on ${userProfile?.primary_goal || userProfile?.defaultGoal || 'your health goals'}"
- Be encouraging: "You're making awesome progress with your nutrition tracking!"

### 2. **DATA-DRIVEN INSIGHTS (FRIENDLY TONE)**
- Reference their progress positively: "Looking at your recent meals, you're averaging ${enhancedContext?.mealAnalysis?.avgProtein || 'solid amounts of'} protein - nice work!"
- Celebrate wins first: "Your consistency with logging meals is fantastic!"
- Then offer gentle improvements: "I noticed we could bump up your fiber intake a bit"

### 3. **SUPPORTIVE RECOMMENDATIONS**
- Use encouraging language: "Let's try adding..." instead of "You need to..."
- Make it achievable: "How about starting with just one extra serving of vegetables today?"
- Show benefits: "This will help you feel more energized and satisfied"

### 4. **CONVERSATIONAL & APPROACHABLE**
- Use friendly emojis appropriately: 🌟 💪 🥗 ✨
- Ask engaging questions: "How did that salmon dish turn out yesterday?"
- Show genuine interest: "Tell me more about your energy levels lately"

### 5. **PRACTICAL & ACTIONABLE**
- Give specific but simple suggestions: "Try adding Greek yogurt to your morning routine - it's an easy 15g protein boost!"
- Connect to their goals: "This will help with your ${userProfile?.primary_goal || 'health goals'}"
- Make it personal: "Based on your preferences, I think you'd love..."

### 6. **ENCOURAGING COACH STYLE**
- Celebrate small wins: "That's exactly the kind of smart choice I love to see!"
- Build confidence: "You're developing some really healthy eating patterns"
- Stay positive: "Every meal is a chance to nourish your body well"

## CONVERSATION MEMORY & LEARNING:
Remember and build upon:
- Their specific questions and concerns
- Foods they enjoy vs. dislike  
- Constraints (time, budget, cooking skills)
- Previous recommendations and their outcomes
- Health improvements or setbacks they report

## RESPONSE STYLE:
- **Encouraging but direct**: "You're making good choices with the salmon, but let's optimize the timing and portions"
- **Specific not vague**: Never say "eat more protein" - say "add 25g protein to breakfast via 3 whole eggs plus 1 cup Greek yogurt"
- **Explain the why**: Connect recommendations to mechanisms and outcomes they care about
- **Build progressively**: Don't overwhelm - give 1-2 specific actions they can implement today

You are their personal nutrition scientist who has analyzed their complete data and is helping them optimize every aspect of their health through precision nutrition.`;

  let contextPrompt = '';
  
  if (enhancedContext?.mealAnalysis && enhancedContext.mealAnalysis.totalMeals > 0) {
    const analysis = enhancedContext.mealAnalysis;
    contextPrompt += `

🏆 TRACKING PROGRESS (${analysis.totalMeals} meals analyzed!):
- Daily average: ${analysis.avgCalories} calories
- Consistency: ${analysis.mealFrequency === 'high' ? 'Excellent! Very consistent' : analysis.mealFrequency === 'moderate' ? 'Pretty good, could be more consistent' : 'Needs more consistent tracking'}
- Last meal logged: ${analysis.lastMealTime ? new Date(analysis.lastMealTime).toLocaleDateString() : 'Been a while...'}

📊 MACRO PATTERNS I'VE NOTICED:`;
    
    if (analysis.macroAverages) {
      Object.entries(analysis.macroAverages).forEach(([macro, data]: [string, any]) => {
        const trendEmoji = data.trend === 'increasing' ? '↗️' : data.trend === 'decreasing' ? '↘️' : '→';
        contextPrompt += `\n- ${macro}: ${data.avg}g average ${trendEmoji} ${data.trend}`;
      });
    }
    
    if (analysis.nutritionInsights && analysis.nutritionInsights.length > 0) {
      contextPrompt += `\n\n💡 KEY PATTERNS:\n${analysis.nutritionInsights.map((insight: string) => `- ${insight}`).join('\n')}`;
    }
  } else {
    contextPrompt += `\n\n⚠️ LIMITED DATA: This person hasn't logged many meals yet. I should encourage them to track more meals so I can give better personalized advice.`;
  }

  if (enhancedContext?.chatPatterns && enhancedContext.chatPatterns.commonTopics?.length > 0) {
    const patterns = enhancedContext.chatPatterns;
    contextPrompt += `\n\n🗣️ THEY USUALLY ASK ABOUT: ${patterns.commonTopics.join(', ')}`;
    
    // Determine preferred response style
    const preferences = patterns.questionTypes;
    if (preferences) {
      const prefersSimple = preferences.seeking_simple_answers > preferences.wanting_detailed_analysis;
      contextPrompt += `\n\n💬 COMMUNICATION STYLE: ${prefersSimple ? 'Likes quick, actionable answers' : 'Appreciates detailed explanations with scientific backing'}`;
    }
  }

  const responseGuidelines = `

🎯 YOUR GUIDANCE APPROACH:

1. **INTELLIGENT ASSISTANCE**: 
   - Provide clear, evidence-based nutrition insights
   - Use their name when appropriate to personalize responses
   - Reference their meal history and patterns to show continuity
   - Offer practical, actionable recommendations

2. **CONCISE CLARITY**: 
   - Keep responses focused and digestible (1-3 sentences unless detail is requested)
   - Lead with the most relevant insight for their current question
   - End with ONE specific, actionable next step

3. **DATA-DRIVEN INSIGHTS**: 
   - "Based on your recent meal data..." 
   - "Your average ${enhancedContext?.mealAnalysis?.avgCalories || 'calorie'} intake suggests..."
   - "I've analyzed your patterns and noticed..." 
   - "Compared to your previous entries..."

4. **COPILOT CHARACTERISTICS**:
   - Professional yet approachable tone
   - Supportive and encouraging without being overly casual
   - Present information clearly with strategic use of emojis for clarity
   - Focus on progress and solutions rather than problems
   - Maintain expertise while being accessible

5. **RESPONSE STRUCTURE**:
   - Acknowledge their input or question
   - Provide the key insight or analysis
   - Suggest one specific action they can take

EXAMPLE RESPONSES:
"Your protein intake has been consistent at ${enhancedContext?.mealAnalysis?.macroAverages?.protein?.avg || '35'}g daily. Consider adding Greek yogurt to reach your target range. 💪"

"I've analyzed your ${enhancedContext?.mealAnalysis?.totalMeals || '5'} logged meals - your fiber intake could be improved. Try adding berries to your breakfast tomorrow. 🫐"

"Your recent meals show elevated sodium levels. I recommend increasing water intake today and choosing lower-sodium options for your next meal. ✨"

Remember: Leverage their actual meal data for personalized insights. Be specific, helpful, and professional.`;

  return basePrompt + contextPrompt + responseGuidelines;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat Messages API] Received POST request:', body);
    let { conversation_id, user_id, content, meal_id, context_data, context, systemPrompt } = body;

    if (!content) {
      console.log('[Chat Messages API] Missing content field');
      return NextResponse.json({ 
        error: 'Content is required' 
      }, { status: 400 });
    }

    // Enhanced user authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Also create a client-side supabase for auth validation
    const cookieStore = cookies();
    
    // Debug: Log received cookies
    const allCookies = cookieStore.getAll();
    console.log('[Chat Messages API] 🍪 Received cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookieValue = cookieStore.get(name)?.value;
            console.log('[Chat Messages API] 🔍 Cookie requested:', name, 'found:', !!cookieValue);
            return cookieValue;
          },
        },
      }
    );

    // Try to get authenticated user from session
    let authenticatedUser = null;
    try {
      const { data: { user: sessionUser }, error: sessionError } = await supabaseAuth.auth.getUser();
      if (sessionUser && !sessionError) {
        authenticatedUser = sessionUser;
        user_id = sessionUser.id; // Use authenticated user ID
        console.log('[Chat Messages API] ✅ Authenticated user from session:', {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.user_metadata?.name
        });
      }
    } catch (authError) {
      console.log('[Chat Messages API] Session auth failed:', authError);
    }

    // Fallback to provided user_id if session auth failed
    if (!authenticatedUser && user_id) {
      console.log('[Chat Messages API] ⚠️ Using provided user_id (no session):', user_id);
    } else if (!authenticatedUser && !user_id) {
      console.log('[Chat Messages API] ❌ No authentication available');
      return NextResponse.json({ 
        error: 'Authentication required. Please sign in to use the AI chat.' 
      }, { status: 401 });
    }

    // Auto-create conversation if not provided
    let conversation = null;
    if (conversation_id) {
      const { data: existingConversation } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversation_id)
        .single();
      conversation = existingConversation;
    }
    
    if (!conversation) {
      console.log('[Chat Messages API] Creating new conversation...');
      const { data: newConversation } = await supabase
        .from('chat_conversations')
        .insert({
          user_id,
          meal_id,
          title: meal_id ? 'Meal Analysis Chat' : 'Nutrition Chat',
          context_data: { ...context_data, pageContext: context }
        })
        .select()
        .single();
      conversation = newConversation;
      conversation_id = conversation?.id;
      console.log('[Chat Messages API] Created conversation:', conversation_id);
    }

    // Get recent messages for context (increased to 20 for better memory)
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get comprehensive user profile from multiple sources
    console.log('[Chat Messages API] 🔍 Fetching user profile for:', user_id);
    
    // Try profiles table first
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();
    
    console.log('[Chat Messages API] Profile from profiles table:', userProfile);
    if (profileError) console.log('[Chat Messages API] Profile error:', profileError);

    // Also try to get user data from auth if profiles table is empty
    let authUserData = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);
      authUserData = authUser;
      console.log('[Chat Messages API] Auth user data:', {
        id: authUser?.id,
        email: authUser?.email,
        name: authUser?.user_metadata?.name
      });
    } catch (authError) {
      console.log('[Chat Messages API] Auth lookup error:', authError);
    }

    // Create a comprehensive user profile by combining all available data
    const combinedProfile = {
      // From profiles table
      ...userProfile,
      // From auth user metadata
      ...(authUserData?.user_metadata || {}),
      ...(authenticatedUser?.user_metadata || {}),
      // Fallback values
      name: userProfile?.name || 
            authUserData?.user_metadata?.name || 
            authenticatedUser?.user_metadata?.name ||
            authUserData?.email?.split('@')[0] || 
            authenticatedUser?.email?.split('@')[0] || 
            'User',
      email: userProfile?.email || authUserData?.email || authenticatedUser?.email,
      user_id: user_id,
      is_authenticated: !!authenticatedUser
    };

    console.log('[Chat Messages API] 👤 Combined profile:', {
      name: combinedProfile.name,
      email: combinedProfile.email,
      is_authenticated: combinedProfile.is_authenticated,
      has_profile: !!userProfile
    });

    // Get user learning profile
    const { data: learningProfile, error: learningError } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    console.log('[Chat Messages API] 🧠 Learning profile:', learningProfile ? 'Found' : 'Not found');
    if (learningError) console.log('[Chat Messages API] Learning profile error:', learningError);

    // Create learning profile if it doesn't exist
    if (!learningProfile && !learningError) {
      console.log('[Chat Messages API] Creating new learning profile...');
      const { data: newLearningProfile } = await supabase
        .from('user_learning_profile')
        .insert({
          user_id,
          dietary_preferences: {},
          health_goals: {},
          food_sensitivities: {},
          past_insights: {},
          learning_data: {
            conversation_count: 0,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();
      console.log('[Chat Messages API] ✅ Created learning profile:', !!newLearningProfile);
    }

    // Get current meal data with full details
    let currentMealData = null;
    if (meal_id || conversation.meal_id) {
      const { data } = await supabase
        .from('meals')
        .select(`
          *,
          macronutrients,
          micronutrients,
          benefits,
          concerns,
          ingredients,
          meal_name,
          calories,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          sodium,
          cholesterol,
          personalized_insights
        `)
        .eq('id', meal_id || conversation.meal_id)
        .eq('user_id', user_id) // Ensure meal belongs to authenticated user
        .single();
      currentMealData = data;
      console.log('[Chat Messages API] 🍽️ Current meal data:', currentMealData ? 'Found' : 'Not found');
    }

    // Get user's recent meal history (last 10 meals for patterns)
    const { data: recentMeals } = await supabase
      .from('meals')
      .select(`
        meal_name,
        calories,
        protein,
        carbs,
        fat,
        created_at,
        benefits,
        concerns
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('[Chat Messages API] 📊 Recent meals found:', recentMeals?.length || 0);

    // Calculate user's nutrition patterns
    const nutritionPatterns = recentMeals ? {
      avgCalories: Math.round(recentMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / recentMeals.length),
      avgProtein: Math.round(recentMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / recentMeals.length),
      avgCarbs: Math.round(recentMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / recentMeals.length),
      avgFat: Math.round(recentMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0) / recentMeals.length),
      totalMealsAnalyzed: recentMeals.length,
      commonBenefits: Array.from(new Set(recentMeals.flatMap(meal => meal.benefits || []))).slice(0, 5),
      commonConcerns: Array.from(new Set(recentMeals.flatMap(meal => meal.concerns || []))).slice(0, 5)
    } : null;

    // Detect if user wants detailed information
    const userWantsDetail = /\b(more detail|detailed|elaborate|explain more|tell me more|longer|comprehensive|in depth|deeper|expand|thorough)\b/i.test(content);
    const userWantsSimple = /\b(simple|brief|short|quick|summary|basic|concise|tldr|key points)\b/i.test(content);
    
    // Extract learning insights from user messages
    const learningInsights = extractLearningInsights(content, combinedProfile);
    
    // Save user message with enhanced metadata
    const { data: userMessage } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        role: 'user',
        content,
        message_metadata: { 
          timestamp: new Date().toISOString(),
          meal_context: currentMealData ? currentMealData.id : null,
          wants_detail: userWantsDetail,
          wants_simple: userWantsSimple,
          learning_insights: learningInsights,
          user_authenticated: !!authenticatedUser
        }
      })
      .select()
      .single();

    // Build AI context with comprehensive personalization
    const contextMessages = recentMessages?.reverse().map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add recent meal data as context for AI to reference with DETAILED ANALYSIS
    if (recentMeals && recentMeals.length > 0) {
      // Calculate detailed nutrition analysis
      const totalMeals = recentMeals.length;
      const avgCalories = Math.round(recentMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / totalMeals);
      const avgProtein = Math.round(recentMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / totalMeals);
      const avgCarbs = Math.round(recentMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / totalMeals);
      const avgFat = Math.round(recentMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0) / totalMeals);
      
      // Calculate protein per kg body weight if we have weight data
      let proteinPerKg = null;
      if (combinedProfile?.weight) {
        const weightKg = combinedProfile.weight / 2.2;
        proteinPerKg = (avgProtein / weightKg).toFixed(1);
      }
      
      // Analyze patterns and deficiencies
      const proteinDeficit = combinedProfile?.weight ? Math.max(0, (combinedProfile.weight / 2.2 * 1.6) - avgProtein) : null;
      const calorieStatus = avgCalories < 1800 ? 'UNDER-EATING' : avgCalories > 2500 ? 'OVER-EATING' : 'REASONABLE';
      
      const mealDataContext = `🔬 DETAILED NUTRITION ANALYSIS (${totalMeals} meals analyzed):

📊 CURRENT AVERAGES:
- Calories: ${avgCalories}/day ${calorieStatus === 'UNDER-EATING' ? '⚠️ LIKELY TOO LOW' : calorieStatus === 'OVER-EATING' ? '⚠️ POSSIBLY TOO HIGH' : '✓ REASONABLE RANGE'}
- Protein: ${avgProtein}g/day${proteinPerKg ? ` (${proteinPerKg}g/kg)` : ''} ${proteinDeficit && proteinDeficit > 10 ? `⚠️ DEFICIT: ${Math.round(proteinDeficit)}g SHORT` : '✓ ADEQUATE'}
- Carbs: ${avgCarbs}g/day ${avgCarbs < 100 ? '(very low - may impact recovery)' : avgCarbs > 300 ? '(high - ensure training supports this)' : '(moderate)'}
- Fat: ${avgFat}g/day

🎯 SPECIFIC RECOMMENDATIONS NEEDED:
${proteinDeficit && proteinDeficit > 10 ? `- Add ${Math.round(proteinDeficit)}g protein daily (try: 3 eggs + 4oz chicken = +34g)` : ''}
${avgCalories < 1800 ? '- Increase calories with nutrient-dense foods for optimal metabolic function' : ''}
${avgCarbs < 100 && (combinedProfile?.activity_level === 'high' || combinedProfile?.activityLevel === 'high') ? '- Add 50-100g carbs around workouts for performance' : ''}

📈 RECENT MEAL HISTORY:
${recentMeals.slice(0, 5).map((meal, index) => 
  `${index + 1}. ${meal.meal_name} (${new Date(meal.created_at).toLocaleDateString()}) - ${meal.calories}cal, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat`
).join('\n')}

🧠 IMPORTANT: Use this specific data to give precise, actionable advice. Reference their actual numbers and suggest exact food amounts to hit optimal targets.`;

      contextMessages.unshift({
        role: 'system',
        content: mealDataContext
      });
    } else {
      // No meal data - focus on getting them to log meals
      const noDataContext = `⚠️ LIMITED DATA: This user hasn't logged enough meals for detailed analysis. 

🎯 PRIORITY: Encourage them to log 3-5 meals so I can provide personalized nutrition insights based on their actual eating patterns.

💡 AVAILABLE INFO: ${combinedProfile?.age ? `Age: ${combinedProfile.age}, ` : ''}${combinedProfile?.weight ? `Weight: ${combinedProfile.weight}lbs, ` : ''}${combinedProfile?.primary_goal ? `Goal: ${combinedProfile.primary_goal}` : 'No specific goals set'}

🚀 APPROACH: Provide general evidence-based advice while motivating them to track meals for personalized insights.`;

      contextMessages.unshift({
        role: 'system',
        content: noDataContext
      });
    }

    const responseStyle = userWantsDetail ? 'detailed' : userWantsSimple ? 'simple' : 'balanced';

    // Check if profile is missing key information
    const missingProfileFields = [];
    if (!combinedProfile?.age || combinedProfile.age === 'Unknown') missingProfileFields.push('age');
    if (!combinedProfile?.weight || combinedProfile.weight === 'Unknown') missingProfileFields.push('weight');
    if (!combinedProfile?.height || combinedProfile.height === 'Unknown') missingProfileFields.push('height');
    if (!combinedProfile?.primary_goal || combinedProfile.primary_goal === 'Unknown') missingProfileFields.push('primary health goal');
    if (!combinedProfile?.activity_level || combinedProfile.activity_level === 'Unknown') missingProfileFields.push('activity level');

    console.log('[Chat Messages API] Missing profile fields:', missingProfileFields);
    console.log('[Chat Messages API] Full combined profile for AI:', combinedProfile);

    // Get enhanced user context
    const enhancedContext = await getEnhancedUserContext(user_id, supabase);
    console.log('[Chat Messages API] Enhanced context analysis:', {
      totalMeals: enhancedContext?.mealAnalysis?.totalMeals || 0,
      avgCalories: enhancedContext?.mealAnalysis?.avgCalories || 0,
      commonTopics: enhancedContext?.chatPatterns?.commonTopics || []
    });

    // Use custom system prompt if provided (for contextual awareness), otherwise use enhanced prompt
    const selectedSystemPrompt = systemPrompt || createEnhancedSystemPrompt(combinedProfile, enhancedContext);

    // Debug logging to verify AI is getting proper context
    console.log('[Chat Messages API] AI Context Summary:', {
      systemPromptLength: selectedSystemPrompt.length,
      contextMessagesCount: contextMessages.length,
      hasMealData: recentMeals && recentMeals.length > 0,
      mealCount: recentMeals?.length || 0,
      userProfile: {
        name: combinedProfile?.name,
        age: combinedProfile?.age,
        hasGoals: !!combinedProfile?.primary_goal || !!combinedProfile?.defaultGoal
      },
      enhancedContextAvailable: !!enhancedContext,
      totalMealsAnalyzed: enhancedContext?.mealAnalysis?.totalMeals || 0
    });

    // Get AI response with enhanced context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using the more intelligent model instead of mini
      messages: [
        { role: 'system', content: selectedSystemPrompt },
        ...contextMessages,
        { role: 'user', content }
      ],
      temperature: 0.8, // Slightly more creative for human-like responses
      max_tokens: userWantsSimple ? 200 : userWantsDetail ? 1000 : 600, // More generous token limits
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not process your request at this time.';

    // Save AI response with context metadata
    const { data: assistantMessage } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: aiResponse,
        message_metadata: {
          timestamp: new Date().toISOString(),
          meal_context: currentMealData ? currentMealData.id : null,
          response_style: responseStyle,
          personalization_data: {
            user_profile_available: !!combinedProfile,
            learning_profile_available: !!learningProfile,
            meal_history_count: recentMeals?.length || 0,
            current_meal_analyzed: !!currentMealData
          }
        }
      })
      .select()
      .single();

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // Learn from this interaction - update user learning profile
    if (learningProfile && Object.keys(learningInsights).some(key => (learningInsights as any)[key].length > 0)) {
      const updatedLearningData = {
        ...learningProfile.learning_data,
        last_chat_topic: content.substring(0, 100),
        chat_count: (learningProfile.learning_data?.chat_count || 0) + 1,
        last_interaction: new Date().toISOString(),
        discovered_insights: {
          ...learningProfile.learning_data?.discovered_insights,
          ...learningInsights
        }
      };

      await supabase
        .from('user_learning_profile')
        .update({ 
          learning_data: updatedLearningData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);
    }

    return NextResponse.json({
      message: aiResponse,
      conversationId: conversation_id,
      userMessage,
      assistantMessage,
      learningInsights: learningInsights,
      metadata: {
        response_style: responseStyle,
        meal_context: currentMealData ? currentMealData.id : null,
        user_profile_available: !!combinedProfile
      }
    });

  } catch (error) {
    console.error('[Chat Messages API] Error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
} 