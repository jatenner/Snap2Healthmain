import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { syncWhoopData } from '../../../lib/whoop';
import { computeDailyBiometricSummary } from '../../../lib/daily-summaries';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await syncWhoopData(user.id);

    // Recompute biometric summaries for today and yesterday in background
    // (recovery from last night maps to today, sleep may span both)
    const today = new Date().toISOString().split('T')[0]!;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;

    Promise.all([
      computeDailyBiometricSummary(user.id, today),
      computeDailyBiometricSummary(user.id, yesterday),
    ]).catch(e => console.error('Background biometric summary failed:', e));

    return NextResponse.json({
      success: true,
      message: 'WHOOP data synced successfully',
      synced: results,
    });
  } catch (err: any) {
    console.error('WHOOP sync error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to sync WHOOP data' },
      { status: 500 }
    );
  }
}
