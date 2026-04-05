import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET: List user's recurring habits
export async function GET() {
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

    const { data: habits, error } = await admin
      .from('recurring_habits')
      .select('*')
      .eq('user_id', user.id)
      .order('time_of_day', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }

    return NextResponse.json({ habits: habits || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create a new recurring habit (from preset or custom)
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
    const { presetId, name, intakeType, timeOfDay, frequency, nutrients } = body;

    let habitRecord: Record<string, any> = {
      user_id: user.id,
      time_of_day: timeOfDay || '08:00',
      frequency: frequency || 'daily',
      active: true,
    };

    if (presetId) {
      // Create from preset
      const { data: preset, error: presetError } = await admin
        .from('quick_add_presets')
        .select('*')
        .eq('id', presetId)
        .single();

      if (presetError || !preset) {
        return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
      }

      habitRecord = {
        ...habitRecord,
        preset_id: preset.id,
        name: preset.name,
        intake_type: preset.intake_type,
        calories: preset.calories || 0,
        protein: preset.protein || 0,
        carbs: preset.carbs || 0,
        fat: preset.fat || 0,
        macronutrients: preset.macronutrients || [],
        micronutrients: preset.micronutrients || [],
        water_ml: preset.water_ml,
      };
    } else {
      // Custom habit
      if (!name || !intakeType) {
        return NextResponse.json({ error: 'name and intakeType required' }, { status: 400 });
      }
      const n = nutrients || {};
      habitRecord = {
        ...habitRecord,
        name,
        intake_type: intakeType,
        calories: n.calories || 0,
        protein: n.protein || 0,
        carbs: n.carbs || 0,
        fat: n.fat || 0,
        macronutrients: n.macronutrients || [],
        micronutrients: n.micronutrients || [],
        water_ml: n.water_ml || null,
      };
    }

    const { data: inserted, error: insertError } = await admin
      .from('recurring_habits')
      .insert([habitRecord])
      .select('id, name, intake_type, time_of_day, frequency')
      .single();

    if (insertError) {
      console.error('[habits] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, habit: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: Toggle active/inactive or update
export async function PATCH(request: NextRequest) {
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
    const { habitId, active, timeOfDay, frequency } = body;

    if (!habitId) {
      return NextResponse.json({ error: 'habitId required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (active !== undefined) updates.active = active;
    if (timeOfDay) updates.time_of_day = timeOfDay;
    if (frequency) updates.frequency = frequency;

    const { error: updateError } = await admin
      .from('recurring_habits')
      .update(updates)
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Remove a habit
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
    const habitId = url.searchParams.get('id');

    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID required' }, { status: 400 });
    }

    const { error: deleteError } = await admin
      .from('recurring_habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
