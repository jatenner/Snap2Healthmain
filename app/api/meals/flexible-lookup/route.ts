import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mealId } = await request.json();

    if (!mealId) {
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[flexible-lookup] Error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
