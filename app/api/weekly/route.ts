import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { buildWeeklySummary } from '../../lib/weekly-intelligence';
import { loadSignalMemory } from '../../lib/signal-memory';
import { getUserTimezone, getTodayInTimezone } from '../../lib/timezone-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userTz = getUserTimezone(request.headers);
    const today = getTodayInTimezone(userTz);
    const userId = user.id;

    // Compute week boundaries (Monday-based)
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(todayDate);
    thisMonday.setDate(todayDate.getDate() - mondayOffset);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);

    const thisWeekStart = thisMonday.toISOString().split('T')[0]!;
    const lastWeekStart = lastMonday.toISOString().split('T')[0]!;
    const lastWeekEnd = lastSunday.toISOString().split('T')[0]!;

    // Fetch data in parallel
    const [thisWeekNut, lastWeekNut, thisWeekBio, lastWeekBio, signals] = await Promise.all([
      admin.from('daily_nutrition_summaries')
        .select('*').eq('user_id', userId)
        .gte('summary_date', thisWeekStart).lte('summary_date', today)
        .order('summary_date').then(r => r.data || []),
      admin.from('daily_nutrition_summaries')
        .select('*').eq('user_id', userId)
        .gte('summary_date', lastWeekStart).lte('summary_date', lastWeekEnd)
        .order('summary_date').then(r => r.data || []),
      admin.from('daily_biometric_summaries')
        .select('*').eq('user_id', userId)
        .gte('summary_date', thisWeekStart).lte('summary_date', today)
        .order('summary_date').then(r => r.data || []),
      admin.from('daily_biometric_summaries')
        .select('*').eq('user_id', userId)
        .gte('summary_date', lastWeekStart).lte('summary_date', lastWeekEnd)
        .order('summary_date').then(r => r.data || []),
      loadSignalMemory(userId),
    ]);

    const summary = buildWeeklySummary(
      thisWeekNut, lastWeekNut, thisWeekBio, lastWeekBio, signals, thisWeekStart,
    );

    // Generate a narrative for the weekly summary
    let narrative = '';
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000 });
      const winsText = summary.wins.map(w => w.detail).join('; ') || 'No notable wins.';
      const risksText = summary.risks.map(r => `${r.label}: ${r.detail}`).join('; ') || 'No active risks.';
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You summarize pre-computed weekly health data in 2-3 sentences. Be conversational. Do NOT speculate about hormones or biology not in the data. Reference specific numbers.' },
          { role: 'user', content: `Weekly summary (${summary.daysLogged} days, ${summary.totalMeals} meals):\nWins: ${winsText}\nRisks: ${risksText}\nCalorie delta: ${summary.avgCaloriesDelta ?? 'N/A'}, Protein delta: ${summary.avgProteinDelta ?? 'N/A'}, Sleep delta: ${summary.avgSleepDelta ?? 'N/A'}, Recovery delta: ${summary.avgRecoveryDelta ?? 'N/A'}\nFocus: ${summary.focusRecommendation || 'Keep logging.'}\nUnresolved issues: ${summary.unresolvedCount}, Resolved: ${summary.resolvedCount}, Improving: ${summary.improvingCount}` },
        ],
        max_tokens: 200,
        temperature: 0.15,
      });
      narrative = completion.choices[0]?.message?.content?.trim() || '';
    } catch {
      // Deterministic fallback
      if (summary.wins.length > 0) narrative = summary.wins[0]!.detail;
      else if (summary.focusRecommendation) narrative = summary.focusRecommendation;
    }

    return NextResponse.json({ ...summary, narrative });
  } catch (err) {
    console.error('[weekly] Error:', err);
    return NextResponse.json({ error: 'Failed to generate weekly summary' }, { status: 500 });
  }
}
