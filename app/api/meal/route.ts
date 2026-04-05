import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mealId = url.searchParams.get('id');

  if (!mealId) {
    return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Query the database for the specific meal
    const { data: meal, error: dbError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();

    if (dbError) {
      console.error('Error fetching meal:', dbError.message);
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
    }

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json(meal);
  } catch (error: any) {
    console.error('Unexpected error in meal API:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}
