import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('meals')
      .select('*')
      .eq('user_id', user.id);

    if (search) {
      query = query.or(`meal_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[api/meals] Database error:', error);
      return NextResponse.json({ error: 'Error retrieving meals', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[api/meals] Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const mealData = {
      ...body,
      user_id: user.id,
      meal_name: body.meal_name || body.mealName || 'Untitled Meal',
      calories: body.calories || 0,
    };

    const { data, error } = await supabaseAdmin
      .from('meals')
      .insert(mealData)
      .select('*')
      .single();

    if (error) {
      console.error('[api/meals] Error creating meal:', error);
      return NextResponse.json({ error: 'Failed to create meal', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/meals] Error:', error);
    return NextResponse.json({ error: 'Error creating meal' }, { status: 500 });
  }
}
