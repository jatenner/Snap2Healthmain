import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the session
    const { userId } = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to view meals' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch the meals from Supabase
    const { data, error, count } = await supabase
      .from('meals')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('[api/meals] Database error:', error);
      return NextResponse.json(
        { error: 'Error fetching meals' },
        { status: 500 }
      );
    }
    
    // Return the meals with pagination info
    return NextResponse.json({
      meals: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: count ? offset + limit < count : false
    });
  } catch (error: any) {
    console.error('[api/meals] Error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 