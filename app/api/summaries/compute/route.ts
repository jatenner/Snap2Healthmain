import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { computeAllSummaries, computeDailyNutritionSummary, computeDailyBiometricSummary } from '../../../lib/daily-summaries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { date, startDate, endDate } = body;

    // Single date computation
    if (date) {
      const [nutrition, biometric] = await Promise.all([
        computeDailyNutritionSummary(user.id, date),
        computeDailyBiometricSummary(user.id, date),
      ]);

      return NextResponse.json({
        success: true,
        date,
        nutrition: nutrition ? 'computed' : 'no_data',
        biometric: biometric ? 'computed' : 'no_data',
      });
    }

    // Date range computation (for backfill)
    if (startDate && endDate) {
      const results = await computeAllSummaries(user.id, startDate, endDate);

      return NextResponse.json({
        success: true,
        range: { startDate, endDate },
        computed: results,
      });
    }

    // Default: compute today
    const today = new Date().toISOString().split('T')[0]!;
    const [nutrition, biometric] = await Promise.all([
      computeDailyNutritionSummary(user.id, today),
      computeDailyBiometricSummary(user.id, today),
    ]);

    return NextResponse.json({
      success: true,
      date: today,
      nutrition: nutrition ? 'computed' : 'no_data',
      biometric: biometric ? 'computed' : 'no_data',
    });
  } catch (err: any) {
    console.error('Summary computation error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to compute summaries' },
      { status: 500 }
    );
  }
}
