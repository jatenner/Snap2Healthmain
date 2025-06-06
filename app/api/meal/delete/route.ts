import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
  
  try {
    const supabase = createClient();
    
    // Get meal ID from URL
    const { searchParams } = new URL(req.url);
    const mealId = searchParams.get('id');
    
    if (!mealId) {
      return NextResponse.json({ error: 'Missing meal ID' }, { status: 400 });
    }
    
    // For development IDs, just return success without hitting database
    if (bypassAuth && mealId.startsWith('dev-')) {
      console.log(`Simulating deletion of development meal ID: ${mealId}`);
      return NextResponse.json({ success: true });
    }
    
    // For regular IDs, authenticate and delete from database
    const cookieStore = cookies();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error fetching session:', authError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user?.id && !bypassAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Use placeholder ID in development mode
    const userId = session?.user?.id || (bypassAuth ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not available' }, { status: 400 });
    }
    
    // First, verify that the meal belongs to the current user
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