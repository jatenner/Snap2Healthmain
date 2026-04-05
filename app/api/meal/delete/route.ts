import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get meal ID from URL
    const { searchParams } = new URL(req.url);
    const mealId = searchParams.get('id');

    if (!mealId) {
      return NextResponse.json({ error: 'Missing meal ID' }, { status: 400 });
    }

    // Verify that the meal belongs to the current user
    const { data: meal, error: findError } = await supabase
      .from('meals')
      .select('id')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();

    if (findError) {
      console.error('Error finding meal:', findError.message);
      return NextResponse.json({ error: 'Database error', details: findError.message }, { status: 500 });
    }

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete the meal
    const { error: deleteError } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting meal:', deleteError.message);
      return NextResponse.json({ error: 'Failed to delete meal', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in meal delete API:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete meal' }, { status: 500 });
  }
}
