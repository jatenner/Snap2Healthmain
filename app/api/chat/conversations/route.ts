import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const meal_id = searchParams.get('meal_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('chat_conversations')
      .select(`
        *,
        messages:chat_messages(*)
      `)
      .eq('user_id', user_id);

    if (meal_id) {
      query = query.eq('meal_id', meal_id);
    }

    const { data: conversations, error } = await query
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[Chat API] Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST: Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat Conversations API] Received POST request:', body);
    const { user_id, meal_id, title, context_data } = body;

    if (!user_id) {
      console.log('[Chat Conversations API] Missing user_id');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get meal context if meal_id provided
    let mealContext = null;
    if (meal_id) {
      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('id', meal_id)
        .single();
      mealContext = data;
    }

    // Get or create user learning profile
    let { data: userProfile } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!userProfile) {
      const { data } = await supabase
        .from('user_learning_profile')
        .insert({
          user_id,
          dietary_preferences: {},
          health_goals: {},
          food_sensitivities: {},
          past_insights: {},
          conversation_patterns: {},
          learning_data: {}
        })
        .select()
        .single();
      userProfile = data;
    }

    // Create conversation with enriched context
    const enrichedContext = {
      ...context_data,
      meal: mealContext,
      userProfile: {
        dietary_preferences: userProfile?.dietary_preferences,
        health_goals: userProfile?.health_goals,
        food_sensitivities: userProfile?.food_sensitivities,
        past_insights: userProfile?.past_insights
      },
      timestamp: new Date().toISOString()
    };

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id,
        meal_id,
        title: title || `Chat about ${mealContext?.meal_name || 'Nutrition'}`,
        context_data: enrichedContext
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('[Chat API] Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 