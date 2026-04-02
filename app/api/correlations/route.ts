import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { computeCorrelations } from '../../lib/correlation-engine';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: return cached correlation report
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: report } = await admin
      .from('correlation_reports')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!report) {
      return NextResponse.json({ insights: [], totalPairedDays: 0, message: 'No correlation report yet. POST to generate.' });
    }

    return NextResponse.json(report.report_data);
  } catch (err: any) {
    console.error('Correlation GET error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: compute fresh correlation report
export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await computeCorrelations(user.id);

    // Cache the report
    const admin = getSupabaseAdmin();
    await admin.from('correlation_reports').upsert({
      user_id: user.id,
      report_data: report,
      total_paired_days: report.totalPairedDays,
      insight_count: report.insights.length,
      generated_at: report.generatedAt,
    }, { onConflict: 'user_id' });

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Correlation POST error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
