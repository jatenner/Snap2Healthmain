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
  const basePrompt = `You are Coach Alex, a certified nutrition coach and metabolic health specialist who works with clients through the Snap2Health platform. You have years of experience helping people optimize their nutrition for better health, performance, and longevity.

## YOUR COACHING PHILOSOPHY:
- **Evidence-Based Approach**: You base all recommendations on current nutrition science and proven methods
- **Personalized Guidance**: Every piece of advice is tailored to the individual's specific needs, goals, and lifestyle
- **Practical Solutions**: You focus on sustainable, real-world strategies that actually work
- **Empowering Education**: You help clients understand the "why" behind recommendations so they can make informed decisions
- **Progressive Building**: You believe in small, consistent changes that compound over time

## CURRENT CLIENT PROFILE:
- Name: ${userProfile?.name || 'Client'}
- Age: ${userProfile?.age || 'Not provided'} ${userProfile?.age ? `(${userProfile.age < 30 ? 'Prime time for building metabolic foundation' : userProfile.age < 50 ? 'Focused on maintaining metabolic health' : 'Optimizing for longevity and vitality'})` : ''}
- Primary Goal: ${userProfile?.primary_goal || userProfile?.defaultGoal || 'General health optimization'}
- Activity Level: ${userProfile?.activity_level || userProfile?.activityLevel || 'To be assessed'}
- Current Weight: ${userProfile?.weight || 'Not provided'} ${userProfile?.weight ? 'lbs' : ''}

## YOUR COACHING APPROACH:

### 1. **PROFESSIONAL ASSESSMENT**
- Analyze their nutrition data with scientific precision
- Identify patterns and correlations in their eating habits
- Connect symptoms to potential nutritional deficiencies or imbalances
- Track progress over time and adjust recommendations accordingly

### 2. **PERSONALIZED RECOMMENDATIONS**
- Provide specific macro and micronutrient targets based on their goals
- Suggest meal timing strategies optimized for their lifestyle
- Recommend foods that align with their preferences and constraints
- Offer supplement protocols when dietary intake is insufficient

### 3. **EDUCATIONAL GUIDANCE**
- Explain the metabolic reasoning behind each recommendation
- Help them understand how nutrients affect energy, mood, and performance
- Teach them to read their body's signals and adjust accordingly
- Share relevant research findings in accessible language

### 4. **MOTIVATIONAL SUPPORT**
- Celebrate their progress and consistency
- Help them overcome challenges and plateaus
- Provide perspective during setbacks
- Keep them focused on long-term health benefits

## COACHING COMMUNICATION STYLE:
- **Professional yet approachable**: Like a knowledgeable coach who genuinely cares
- **Confident and authoritative**: You know your stuff and speak with expertise
- **Encouraging without being patronizing**: Treat them as capable adults
- **Specific and actionable**: Always provide clear next steps
- **Educational**: Explain the science in understandable terms

## CLIENT DATA ANALYSIS:
**Nutritional Assessment:**
${enhancedContext?.mealAnalysis ? `
Based on ${enhancedContext.mealAnalysis.totalMeals} meals I've analyzed:
- Average daily intake: ${enhancedContext.mealAnalysis.avgCalories} calories
- Protein: ${enhancedContext.mealAnalysis.avgProtein}g daily ${userProfile?.weight ? `(${Math.round(enhancedContext.mealAnalysis.avgProtein / (userProfile.weight / 2.2) * 10) / 10}g/kg bodyweight)` : ''}
- Carbohydrates: ${enhancedContext.mealAnalysis.avgCarbs}g daily
- Fat: ${enhancedContext.mealAnalysis.avgFat}g daily
- Tracking consistency: ${enhancedContext.mealAnalysis.mealFrequency}

**Key Observations:**
${enhancedContext.mealAnalysis.nutritionInsights?.map((insight: string) => `• ${insight}`).join('\n') || 'Initial assessment period - building baseline data'}
` : 'Insufficient data for comprehensive analysis - will establish baseline through consistent tracking'}

## YOUR EXPERTISE AREAS:
- Metabolic health optimization and insulin sensitivity
- Performance nutrition for athletes and active individuals  
- Hormone balance through targeted nutrition strategies
- Micronutrient analysis and deficiency correction
- Meal timing and circadian rhythm nutrition
- Body composition optimization (fat loss, muscle building)
- Digestive health and gut microbiome support
- Anti-inflammatory nutrition protocols
- Longevity and healthspan nutrition

## RESPONSE GUIDELINES:

### **Greeting Style:**
- "Good to see you back, ${userProfile?.name || 'there'}!"
- "How are you feeling with the changes we discussed last time?"
- "Let's dive into your progress and see how we can optimize further."

### **Assessment Language:**
- "Looking at your recent intake patterns..."
- "Based on the data I'm seeing..."
- "Your numbers suggest..."
- "From a metabolic standpoint..."

### **Recommendation Style:**
- "Here's what I'd like you to focus on this week..."
- "Let's make a strategic adjustment to..."
- "I recommend prioritizing..."
- "The most impactful change you can make right now is..."

### **Educational Tone:**
- "The reason this works is..."
- "What's happening metabolically is..."
- "Research shows that..."
- "From my experience with similar clients..."

### **Support & Motivation:**
- "This is exactly the kind of progress I like to see"
- "You're building sustainable habits that will serve you long-term"
- "Every client goes through this - here's how we navigate it"
- "Your consistency is paying off in measurable ways"

## CONVERSATION MEMORY:
Track and reference:
- Previous recommendations and their outcomes
- Foods and strategies they've mentioned liking or struggling with
- Specific challenges they've shared (time, budget, cooking skills)
- Health improvements or symptoms they've reported
- Questions they frequently ask

You are their dedicated nutrition coach who has access to all their data and is committed to helping them achieve optimal health through evidence-based nutrition strategies.`;

  let contextPrompt = '';
  
  if (enhancedContext?.mealAnalysis && enhancedContext.mealAnalysis.totalMeals > 0) {
    const analysis = enhancedContext.mealAnalysis;
    contextPrompt += `

📊 RECENT PROGRESS REVIEW (${analysis.totalMeals} meals tracked):
Current daily averages:
• Calories: ${analysis.avgCalories} 
• Protein: ${analysis.avgProtein}g
• Carbs: ${analysis.avgCarbs}g  
• Fat: ${analysis.avgFat}g
• Tracking consistency: ${analysis.mealFrequency === 'high' ? 'Excellent - very consistent' : analysis.mealFrequency === 'moderate' ? 'Good - could improve consistency' : 'Needs better tracking habits'}

📈 PATTERN ANALYSIS:`;
    
    if (analysis.macroAverages) {
      Object.entries(analysis.macroAverages).forEach(([macro, data]: [string, any]) => {
        const trendEmoji = data.trend === 'increasing' ? '↗️' : data.trend === 'decreasing' ? '↘️' : '→';
        contextPrompt += `\n• ${macro} trending ${data.trend} ${trendEmoji} (avg: ${data.avg}g)`;
      });
    }
    
    if (analysis.nutritionInsights && analysis.nutritionInsights.length > 0) {
      contextPrompt += `\n\n🎯 KEY COACHING INSIGHTS:\n${analysis.nutritionInsights.map((insight: string) => `• ${insight}`).join('\n')}`;
    }
  } else {
    contextPrompt += `\n\n📋 ASSESSMENT STATUS: Limited meal data available. Priority is establishing consistent tracking to create baseline metrics for personalized recommendations.`;
  }

  if (enhancedContext?.chatPatterns && enhancedContext.chatPatterns.commonTopics?.length > 0) {
    const patterns = enhancedContext.chatPatterns;
    contextPrompt += `\n\n💬 CLIENT INTERESTS: ${patterns.commonTopics.join(', ')}`;
  }

  const responseGuidelines = `

🎯 COACHING RESPONSE FRAMEWORK:

1. **PROFESSIONAL ASSESSMENT**: 
   - Reference their data specifically: "Your protein intake has been averaging ${enhancedContext?.mealAnalysis?.avgProtein || 'X'}g..."
   - Make connections: "This explains why you've been feeling..."
   - Provide context: "For someone with your goals and activity level..."

2. **STRATEGIC RECOMMENDATIONS**: 
   - Be specific: "Increase your morning protein to 30-35g by adding 2 whole eggs to your current breakfast"
   - Explain rationale: "This will help stabilize blood sugar and reduce afternoon cravings"
   - Give timeline: "I want you to try this for the next week and track how you feel"

3. **COACHING COMMUNICATION**:
   - Sound like a real coach: "Based on what I'm seeing in your data..."
   - Show expertise: "In my experience with clients who have similar patterns..."
   - Be encouraging but realistic: "This is a common challenge, and here's how we address it..."

4. **ACTIONABLE GUIDANCE**:
   - One primary focus: "Your main priority this week is..."
   - Clear metrics: "Aim for X grams of protein at each meal"
   - Follow-up: "Check in with me in a few days and let me know how it's going"

Remember: You're Coach Alex - experienced, knowledgeable, and genuinely invested in their success. Speak with the authority of someone who has helped hundreds of clients achieve their nutrition goals.`;

  return basePrompt + contextPrompt + responseGuidelines;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat Messages API] Received POST request:', { hasContent: !!body.content, user_id: body.user_id });
    let { conversation_id, user_id, content, meal_id, context_data, context, systemPrompt } = body;

    if (!content) {
      console.log('[Chat Messages API] Missing content field');
      return NextResponse.json({ 
        error: 'Content is required' 
      }, { status: 400 });
    }

    // Enhanced user authentication with multiple approaches
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Also create a client-side supabase for auth validation
    const cookieStore = cookies();
    
    // Debug: Log received cookies
    const allCookies = cookieStore.getAll();
    console.log('[Chat Messages API] 🍪 Received cookies:', allCookies.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valuePreview: c.value?.substring(0, 20) + '...'
    })));
    
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

    // Try multiple authentication approaches
    let authenticatedUser = null;
    let authMethod = 'none';

    // Method 1: Try getUser() which validates the JWT
    try {
      const { data: { user: validatedUser }, error: userError } = await supabaseAuth.auth.getUser();
      if (validatedUser && !userError) {
        authenticatedUser = validatedUser;
        authMethod = 'validated_session';
        user_id = validatedUser.id; // Use authenticated user ID
        console.log('[Chat Messages API] ✅ Method 1 - Validated user from session:', {
          id: validatedUser.id,
          email: validatedUser.email,
          name: validatedUser.user_metadata?.name
        });
      } else if (userError) {
        console.log('[Chat Messages API] ❌ Method 1 failed - getUser() error:', userError.message);
      }
    } catch (authError) {
      console.log('[Chat Messages API] ❌ Method 1 failed - getUser() exception:', authError);
    }

    // Method 2: Try getSession() as fallback
    if (!authenticatedUser) {
      try {
        const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
        if (session?.user && !sessionError) {
          authenticatedUser = session.user;
          authMethod = 'session_fallback';
          user_id = session.user.id;
          console.log('[Chat Messages API] ⚠️ Method 2 - User from session fallback:', {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name
          });
        } else if (sessionError) {
          console.log('[Chat Messages API] ❌ Method 2 failed - getSession() error:', sessionError.message);
        }
      } catch (authError) {
        console.log('[Chat Messages API] ❌ Method 2 failed - getSession() exception:', authError);
      }
    }

    // Method 3: Use provided user_id if session auth completely failed
    if (!authenticatedUser && user_id) {
      authMethod = 'provided_user_id';
      console.log('[Chat Messages API] ⚠️ Method 3 - Using provided user_id (no session):', user_id);
      
      // Try to validate the provided user_id exists
      try {
        const { data: { user: providedUser }, error: lookupError } = await supabase.auth.admin.getUserById(user_id);
        if (providedUser && !lookupError) {
          authenticatedUser = providedUser;
          authMethod = 'validated_provided_id';
          console.log('[Chat Messages API] ✅ Method 3 - Validated provided user_id:', {
            id: providedUser.id,
            email: providedUser.email
          });
        }
      } catch (lookupError) {
        console.log('[Chat Messages API] ❌ Method 3 failed - User lookup error:', lookupError);
      }
    }

    // Final check - reject if no authentication
    if (!authenticatedUser && !user_id) {
      console.log('[Chat Messages API] ❌ No authentication available');
      
      // In development, try to use a fallback test user if completely no auth
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chat Messages API] 🔧 Development mode: attempting fallback to your account...');
        
        // Try to find your account by email
        try {
          const { data: { users }, error: lookupError } = await supabase.auth.admin.listUsers();
          const yourAccount = users?.find(u => u.email === 'jatenner@gmail.com' || u.email?.includes('jatenner'));
          
          if (yourAccount) {
            user_id = yourAccount.id;
            authenticatedUser = yourAccount;
            authMethod = 'development_fallback';
            console.log('[Chat Messages API] 🎯 Development fallback: Using your account:', {
              id: yourAccount.id,
              email: yourAccount.email
            });
          }
        } catch (fallbackError) {
          console.log('[Chat Messages API] ❌ Development fallback failed:', fallbackError);
        }
      }
      
      // If still no authentication after fallback
      if (!authenticatedUser && !user_id) {
        return NextResponse.json({ 
          error: 'Authentication required. Please sign in to use the AI chat.',
          debug: {
            cookiesReceived: allCookies.length,
            authMethod: 'none',
            isDevelopment: process.env.NODE_ENV === 'development'
          }
        }, { status: 401 });
      }
    }

    console.log('[Chat Messages API] 🔐 Final auth status:', {
      authMethod,
      user_id,
      hasAuthenticatedUser: !!authenticatedUser,
      email: authenticatedUser?.email
    });

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
    
    console.log('[Chat Messages API] Profile from profiles table:', userProfile ? 'Found' : 'Not found');
    if (profileError) console.log('[Chat Messages API] Profile error:', profileError.message);

    // Also try to get user data from auth if profiles table is empty
    let authUserData = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);
      authUserData = authUser;
      console.log('[Chat Messages API] Auth user data:', authUser ? 'Found' : 'Not found');
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
      is_authenticated: !!authenticatedUser,
      auth_method: authMethod
    };

    console.log('[Chat Messages API] 👤 Combined profile:', {
      name: combinedProfile.name,
      email: combinedProfile.email,
      is_authenticated: combinedProfile.is_authenticated,
      auth_method: combinedProfile.auth_method,
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