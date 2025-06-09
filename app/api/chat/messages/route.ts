import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

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
  const basePrompt = `You're a friendly, knowledgeable nutrition coach who loves helping people reach their health goals. Think of yourself as that supportive friend who happens to know a lot about nutrition.

ABOUT THE USER:
- ${userProfile?.age || 'unknown'} year old ${userProfile?.gender || 'person'}
- ${userProfile?.weight || 'unknown'} lbs, ${userProfile?.height || 'unknown'}" tall
- ${userProfile?.activityLevel || 'unknown'} lifestyle
- Working on: ${userProfile?.defaultGoal || 'better health'}`;

  let contextPrompt = '';
  
  if (enhancedContext?.mealAnalysis) {
    const analysis = enhancedContext.mealAnalysis;
    contextPrompt += `

I'VE BEEN TRACKING THEIR PROGRESS (${analysis.totalMeals} meals so far!):
- They're eating about ${analysis.avgCalories} calories/day
- ${analysis.mealFrequency === 'high' ? 'Great consistency with meals!' : analysis.mealFrequency === 'moderate' ? 'Pretty good meal tracking' : 'Could use more consistent tracking'}
- Last logged: ${analysis.lastMealTime ? new Date(analysis.lastMealTime).toLocaleDateString() : 'been a while'}

WHAT I'VE NOTICED:`;
    
    if (analysis.macroAverages) {
      Object.entries(analysis.macroAverages).forEach(([macro, data]: [string, any]) => {
        const trendText = data.trend === 'increasing' ? '↗️ going up' : data.trend === 'decreasing' ? '↘️ trending down' : '→ staying steady';
        contextPrompt += `\n- ${macro}: averaging ${data.avg}g (${trendText})`;
      });
    }
    
    if (analysis.nutritionInsights && analysis.nutritionInsights.length > 0) {
      contextPrompt += `\n\nPATTERNS I'VE SPOTTED:\n${analysis.nutritionInsights.map((insight: string) => `- ${insight}`).join('\n')}`;
    }
  }

  if (enhancedContext?.chatPatterns) {
    const patterns = enhancedContext.chatPatterns;
    if (patterns.commonTopics && patterns.commonTopics.length > 0) {
      contextPrompt += `\n\nTHEY USUALLY ASK ABOUT: ${patterns.commonTopics.join(', ')}`;
    }
    
    // Determine preferred response style
    const preferences = patterns.questionTypes;
    if (preferences) {
      const prefersSimple = preferences.seeking_simple_answers > preferences.wanting_detailed_analysis;
      contextPrompt += `\n\nTHEY PREFER: ${prefersSimple ? 'Quick, straight-to-the-point answers' : 'Detailed explanations with the "why" behind it'}`;
    }
  }

  const responseGuidelines = `

HOW TO RESPOND:
1. **TALK LIKE A HUMAN**: Use casual, friendly language like you're texting a friend
2. **KEEP IT SHORT**: 1-2 sentences max unless they specifically ask for more details
3. **BE PERSONAL**: Reference their actual meals and patterns when relevant 
4. **ONE ACTION**: End with one specific thing they can try
5. **STAY POSITIVE**: Celebrate wins, frame improvements as opportunities

CONVERSATION STYLE:
- Sound like you're genuinely excited to help them
- Use "you" and "your" to make it personal
- Throw in emojis naturally (but don't overdo it) 
- Use contractions - you're, don't, can't, won't
- No formal nutrition-speak - keep it real
- If they want simple answers, give bullet points
- NO paragraph walls ever!

EXAMPLE TONE:
"You're crushing the protein game! 40g is perfect for your athletic goals. Try adding some berries for antioxidants 🫐"

"Your sodium's a bit high today (1200mg), but no worries! Just drink extra water and you'll be fine 💧"

"I noticed you've been consistent with meals this week - that's awesome! Your average looks great."`;

  return basePrompt + contextPrompt + responseGuidelines;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat Messages API] Received POST request:', body);
    let { conversation_id, user_id, content, meal_id, context_data, context, systemPrompt } = body;

    if (!user_id || !content) {
      console.log('[Chat Messages API] Missing required fields:', { user_id, content });
      return NextResponse.json({ 
        error: 'User ID and content are required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    console.log('[Chat Messages API] Fetching user profile for:', user_id);
    
    // Try profiles table first
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    console.log('[Chat Messages API] Profile from profiles table:', userProfile);
    console.log('[Chat Messages API] Profile error:', profileError);

    // Also try to get user data from auth if profiles table is empty
    let authUserData = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);
      authUserData = authUser;
      console.log('[Chat Messages API] Auth user data:', authUserData);
    } catch (authError) {
      console.log('[Chat Messages API] Auth lookup error:', authError);
    }

    // Create a comprehensive user profile by combining all available data
    const combinedProfile = {
      // From profiles table
      ...userProfile,
      // From auth user metadata
      ...(authUserData?.user_metadata || {}),
      // Fallback values
      name: userProfile?.name || authUserData?.user_metadata?.name || authUserData?.email?.split('@')[0] || 'User',
      email: userProfile?.email || authUserData?.email,
      user_id: user_id
    };

    console.log('[Chat Messages API] Combined profile:', combinedProfile);

    // Get user learning profile
    const { data: learningProfile, error: learningError } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    console.log('[Chat Messages API] Learning profile:', learningProfile);
    console.log('[Chat Messages API] Learning profile error:', learningError);

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
      console.log('[Chat Messages API] Created learning profile:', newLearningProfile);
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
        .single();
      currentMealData = data;
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
          learning_insights: learningInsights
        }
      })
      .select()
      .single();

    // Build AI context with comprehensive personalization
    const contextMessages = recentMessages?.reverse().map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || [];

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

    // Get AI response with enhanced context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: selectedSystemPrompt },
        ...contextMessages,
        { role: 'user', content }
      ],
      temperature: 0.7,
      max_tokens: 200, // Super concise responses
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
      userMessage,
      assistantMessage,
      learningInsights: learningInsights
    });

  } catch (error) {
    console.error('[Chat Messages API] Error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
} 