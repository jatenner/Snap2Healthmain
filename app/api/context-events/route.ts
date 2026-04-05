import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { computeDailyNutritionSummary } from '../../lib/daily-summaries';

export const dynamic = 'force-dynamic';

// GET: List context events for a date range
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const eventType = url.searchParams.get('eventType');

    let query = admin
      .from('context_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_time', { ascending: false });

    if (startDate) query = query.gte('event_time', `${startDate}T00:00:00`);
    if (endDate) query = query.lt('event_time', `${endDate}T23:59:59.999`);
    if (eventType) query = query.eq('event_type', eventType);

    const { data: events, error } = await query.limit(100);

    if (error) {
      console.error('[context-events] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error('[context-events] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create a context event
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { eventType, value, numericValue, rawText, eventTime, source } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    const validTypes = ['energy', 'stress', 'mood', 'symptom', 'note'];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ error: `eventType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const eventRecord = {
      user_id: user.id,
      event_type: eventType,
      value: value || null,
      numeric_value: numericValue ?? null,
      raw_text: rawText || null,
      source: source || 'manual',
      event_time: eventTime || new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin
      .from('context_events')
      .insert([eventRecord])
      .select('id, event_type, value, numeric_value, event_time')
      .single();

    if (insertError) {
      console.error('[context-events] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Recompute daily summary in background (to update context aggregates)
    const dateStr = new Date(eventRecord.event_time).toISOString().split('T')[0]!;
    computeDailyNutritionSummary(user.id, dateStr).catch(e =>
      console.error('[context-events] Background summary error:', e)
    );

    return NextResponse.json({ success: true, event: inserted });
  } catch (error: any) {
    console.error('[context-events] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Remove a context event by ID
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(request.url);
    const eventId = url.searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { error: deleteError } = await admin
      .from('context_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[context-events] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[context-events] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
