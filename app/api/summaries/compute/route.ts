import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { computeAllSummaries, computeDailyNutritionSummary, computeDailyBiometricSummary } from '../../../lib/daily-summaries';
import { UserProfile } from '../../../lib/personalized-nutrition-calculator';

export const dynamic = 'force-dynamic';

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('age, gender, height, height_unit, weight, weight_unit, activity_level, goal')
    .eq('id', userId)
    .single();

  if (!profile || !profile.age || !profile.gender) return null;

  return {
    age: parseInt(profile.age) || 30,
    gender: profile.gender === 'female' ? 'female' : 'male',
    height: parseFloat(profile.height) || 70,
    height_unit: (profile.height_unit || 'in') as 'cm' | 'in',
    weight: parseFloat(profile.weight) || 170,
    weight_unit: (profile.weight_unit || 'lbs') as 'kg' | 'lbs',
    activity_level: (profile.activity_level || 'moderate') as UserProfile['activity_level'],
    goal: profile.goal || 'General Wellness',
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile for personalized DRI targets
    const profile = await fetchUserProfile(user.id);

    const body = await request.json().catch(() => ({}));
    const { date, startDate, endDate } = body;

    // Single date computation
    if (date) {
      const [nutrition, biometric] = await Promise.all([
        computeDailyNutritionSummary(user.id, date, profile),
        computeDailyBiometricSummary(user.id, date),
      ]);

      return NextResponse.json({
        success: true,
        date,
        nutrition: nutrition ? 'computed' : 'no_data',
        biometric: biometric ? 'computed' : 'no_data',
        personalized: !!profile,
      });
    }

    // Date range computation (for backfill)
    if (startDate && endDate) {
      const results = await computeAllSummaries(user.id, startDate, endDate, profile);

      return NextResponse.json({
        success: true,
        range: { startDate, endDate },
        computed: results,
        personalized: !!profile,
      });
    }

    // Default: compute today
    const today = new Date().toISOString().split('T')[0]!;
    const [nutrition, biometric] = await Promise.all([
      computeDailyNutritionSummary(user.id, today, profile),
      computeDailyBiometricSummary(user.id, today),
    ]);

    return NextResponse.json({
      success: true,
      date: today,
      nutrition: nutrition ? 'computed' : 'no_data',
      biometric: biometric ? 'computed' : 'no_data',
      personalized: !!profile,
    });
  } catch (err: any) {
    console.error('Summary computation error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to compute summaries' },
      { status: 500 }
    );
  }
}
