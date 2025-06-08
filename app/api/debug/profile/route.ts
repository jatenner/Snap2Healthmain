import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers or query params
    const user_id = request.nextUrl.searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('[Debug Profile] Checking profile data for user:', user_id);
    
    // Try profiles table first
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    console.log('[Debug Profile] Profile from profiles table:', userProfile);
    console.log('[Debug Profile] Profile error:', profileError);

    // Also try to get user data from auth
    let authUserData = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);
      authUserData = authUser;
      console.log('[Debug Profile] Auth user data:', authUserData);
    } catch (authError) {
      console.log('[Debug Profile] Auth lookup error:', authError);
    }

    // Get learning profile
    const { data: learningProfile, error: learningError } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    console.log('[Debug Profile] Learning profile:', learningProfile);

    // Get recent meals
    const { data: recentMeals } = await supabase
      .from('meals')
      .select('meal_name, calories, protein, carbs, fat, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Create combined profile
    const combinedProfile = {
      ...userProfile,
      ...(authUserData?.user_metadata || {}),
      name: userProfile?.name || authUserData?.user_metadata?.name || authUserData?.email?.split('@')[0] || 'User',
      email: userProfile?.email || authUserData?.email,
      user_id: user_id
    };

    return NextResponse.json({
      success: true,
      data: {
        userProfile,
        profileError,
        authUserData,
        learningProfile,
        learningError,
        combinedProfile,
        recentMeals,
        summary: {
          hasProfile: !!userProfile,
          hasAuth: !!authUserData,
          hasLearning: !!learningProfile,
          mealCount: recentMeals?.length || 0,
          availableFields: Object.keys(combinedProfile).filter(key => combinedProfile[key] !== null && combinedProfile[key] !== undefined && combinedProfile[key] !== 'Unknown')
        }
      }
    });

  } catch (error) {
    console.error('[Debug Profile] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data', details: error }, { status: 500 });
  }
} 