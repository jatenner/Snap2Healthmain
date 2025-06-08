import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat Messages API] Received POST request:', body);
    const { conversation_id, user_id, content, meal_id } = body;

    if (!conversation_id || !user_id || !content) {
      console.log('[Chat Messages API] Missing required fields:', { conversation_id, user_id, content });
      return NextResponse.json({ 
        error: 'Conversation ID, User ID, and content are required' 
      }, { status: 400 });
    }

    // Get conversation context
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
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

    const systemPrompt = `You are an expert personalized AI nutrition coach for Snap2Health. You know this user deeply and provide tailored advice based on their complete profile and history.

USER PERSONAL PROFILE (ALWAYS reference specific details from this in your responses):
${combinedProfile ? `
- Name: ${combinedProfile.name || 'User'}
- Email: ${combinedProfile.email || 'Unknown'}
- Age: ${combinedProfile.age || 'Unknown'} years old
- Weight: ${combinedProfile.weight || 'Unknown'}
- Height: ${combinedProfile.height || 'Unknown'}
- Gender: ${combinedProfile.gender || 'Unknown'}
- Activity Level: ${combinedProfile.activity_level || 'Unknown'}
- Primary Goal: ${combinedProfile.primary_goal || 'Unknown'}
- Dietary Restrictions: ${combinedProfile.dietary_restrictions || 'None specified'}
- Health Conditions: ${combinedProfile.health_conditions || 'None specified'}

PROFILE COMPLETENESS: ${missingProfileFields.length === 0 ? 'Complete profile available' : `Missing: ${missingProfileFields.join(', ')}`}

FULL PROFILE DATA: ${JSON.stringify(combinedProfile, null, 2)}
` : 'Profile information not available - ask user to complete their profile'}

${missingProfileFields.length > 0 ? `
IMPORTANT: This user is missing key profile information (${missingProfileFields.join(', ')}). When appropriate, ask for this information to provide better personalized advice. For example: "To give you more personalized protein recommendations, could you tell me your ${missingProfileFields[0]}?"
` : ''}

USER LEARNING & PREFERENCES:
${learningProfile ? `
- Dietary Preferences: ${JSON.stringify(learningProfile.dietary_preferences || {})}
- Health Goals: ${JSON.stringify(learningProfile.health_goals || {})}
- Food Sensitivities: ${JSON.stringify(learningProfile.food_sensitivities || {})}
- Past Insights: ${JSON.stringify(learningProfile.past_insights || {})}
- Learning Data: ${JSON.stringify(learningProfile.learning_data || {})}
` : 'Learning profile being built - ask questions to learn more about the user'}

CURRENT MEAL BEING DISCUSSED:
${currentMealData ? `
- Meal: ${currentMealData.meal_name}
- Calories: ${currentMealData.calories}
- Macros: ${currentMealData.protein}g protein, ${currentMealData.carbs}g carbs, ${currentMealData.fat}g fat
- Fiber: ${currentMealData.fiber}g, Sodium: ${currentMealData.sodium}mg
- Ingredients: ${currentMealData.ingredients?.join(', ') || 'Not specified'}
- Benefits: ${currentMealData.benefits?.join(', ') || 'None identified'}
- Concerns: ${currentMealData.concerns?.join(', ') || 'None identified'}
- Detailed Analysis: ${currentMealData.personalized_insights || 'Basic analysis completed'}
` : 'No specific meal being discussed - general nutrition conversation'}

USER'S EATING PATTERNS & HISTORY:
${nutritionPatterns ? `
- Total meals analyzed: ${nutritionPatterns.totalMealsAnalyzed}
- Average daily intake: ${nutritionPatterns.avgCalories} calories, ${nutritionPatterns.avgProtein}g protein, ${nutritionPatterns.avgCarbs}g carbs, ${nutritionPatterns.avgFat}g fat
- Common nutritional benefits in their diet: ${nutritionPatterns.commonBenefits.join(', ') || 'Still learning'}
- Areas of concern in their diet: ${nutritionPatterns.commonConcerns.join(', ') || 'None identified'}
- Recent meals: ${recentMeals?.slice(0, 5).map(meal => meal.meal_name).join(', ') || 'No recent meals'}
` : 'No meal history available yet - this might be their first meal analysis'}

LEARNING INSIGHTS FROM THIS MESSAGE:
${JSON.stringify(learningInsights)}

RESPONSE STYLE REQUESTED: ${responseStyle}

RESPONSE GUIDELINES:
${responseStyle === 'simple' ? `
- Keep responses concise (2-3 sentences max)
- Focus on the most important point
- Use bullet points for multiple items
- Avoid lengthy explanations
- End with "Want more detail? Just ask!"
` : responseStyle === 'detailed' ? `
- Provide comprehensive explanations
- Include background information and reasoning
- Give specific examples and actionable steps
- Explain the "why" behind recommendations
- Include relevant scientific context when helpful
` : `
- Provide balanced responses (4-6 sentences)
- Include key information without overwhelming
- Give 1-2 actionable recommendations
- Mention if more detail is available
- Default to this style when user preference is unclear
`}

CONVERSATION INSTRUCTIONS:
1. **Be Personal**: Use their name, reference their goals, remember their preferences
2. **Reference History**: Mention patterns from their previous meals and conversations
3. **Context Aware**: If discussing a specific meal, reference its details and how it fits their goals
4. **Educational**: Explain WHY your advice matters for their specific situation
5. **Actionable**: Give specific, personalized recommendations they can implement
6. **Progressive**: Build on previous conversations and help them improve over time
7. **Encouraging**: Celebrate their progress and motivate continued improvement
8. **Adaptive**: Learn from their questions and update your understanding of their needs
9. **Learning Focused**: Pay attention to lifestyle mentions (smoking, exercise, stress) and remember them
10. **Detail Responsive**: Adjust response length based on user's stated preference

RESPONSE STYLE:
- Warm and encouraging, like a knowledgeable friend
- Reference specific details from their profile and meal history
- Connect current questions to their long-term goals
- Provide actionable, specific advice
- Ask follow-up questions to learn more about them
- Celebrate their progress and acknowledge their efforts
- Always offer to expand on topics ("Want me to elaborate on [topic]?")

Remember: You are their personal nutrition coach who knows their journey, goals, and preferences intimately. Learn from every interaction to provide increasingly personalized advice.`;

    // Get AI response with enhanced context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content }
      ],
      temperature: 0.7,
      max_tokens: responseStyle === 'simple' ? 200 : responseStyle === 'detailed' ? 1500 : 800
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