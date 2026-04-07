import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { computeCorrelations } from '../../../lib/correlation-engine';
import { generateAIInsights } from '../../../lib/ai-insights-interpreter';

export const dynamic = 'force-dynamic';

export async function POST() {
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

    // Fetch correlation report (compute fresh if needed)
    let report = await computeCorrelations(user.id);

    // Fetch user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('age, gender, height, weight, activity_level, goal')
      .eq('id', user.id)
      .single();

    // Fetch recent nutrition summaries (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: recentNut } = await admin
      .from('daily_nutrition_summaries')
      .select('total_calories, total_protein, total_fiber, pct_dv_magnesium, pct_dv_vitamin_d, pct_dv_iron, pct_dv_calcium, pct_dv_zinc')
      .eq('user_id', user.id)
      .gte('summary_date', weekAgo.toISOString().split('T')[0])
      .order('summary_date', { ascending: false });

    // Fetch recent biometric summaries (last 7 days)
    const { data: recentBio } = await admin
      .from('daily_biometric_summaries')
      .select('sleep_score, recovery_score, hrv, resting_heart_rate, trajectory')
      .eq('user_id', user.id)
      .gte('summary_date', weekAgo.toISOString().split('T')[0])
      .order('summary_date', { ascending: false });

    // Compute recent averages
    const avgField = (arr: any[] | null, field: string) => {
      if (!arr || arr.length === 0) return 0;
      const vals = arr.map(r => r[field]).filter((v: any) => v != null);
      return vals.length > 0 ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length * 10) / 10 : 0;
    };

    // Find top nutrient gaps
    const nutrientGaps: string[] = [];
    if (recentNut && recentNut.length > 0) {
      const avgMag = avgField(recentNut, 'pct_dv_magnesium');
      const avgVitD = avgField(recentNut, 'pct_dv_vitamin_d');
      const avgIron = avgField(recentNut, 'pct_dv_iron');
      const avgCalcium = avgField(recentNut, 'pct_dv_calcium');
      const avgZinc = avgField(recentNut, 'pct_dv_zinc');
      if (avgMag < 60) nutrientGaps.push(`Magnesium (${avgMag}% of target)`);
      if (avgVitD < 60) nutrientGaps.push(`Vitamin D (${avgVitD}% of target)`);
      if (avgIron < 60) nutrientGaps.push(`Iron (${avgIron}% of target)`);
      if (avgCalcium < 60) nutrientGaps.push(`Calcium (${avgCalcium}% of target)`);
      if (avgZinc < 60) nutrientGaps.push(`Zinc (${avgZinc}% of target)`);
    }

    const { SYSTEM_DEFAULT_PROFILE: SDP } = await import('../../../lib/personalization-status');
    const aiResponse = await generateAIInsights({
      correlationReport: report,
      userProfile: {
        age: parseInt(profile?.age) || SDP.age,
        gender: profile?.gender || SDP.gender,
        weight: parseFloat(profile?.weight) || SDP.weight,
        height: parseFloat(profile?.height) || SDP.height,
        activityLevel: profile?.activity_level || SDP.activity_level,
        goal: profile?.goal || SDP.goal,
      },
      recentNutrition: recentNut && recentNut.length > 0 ? {
        avgCalories: avgField(recentNut, 'total_calories'),
        avgProtein: avgField(recentNut, 'total_protein'),
        avgFiber: avgField(recentNut, 'total_fiber'),
        topNutrientGaps: nutrientGaps,
        daysLogged: recentNut.length,
      } : undefined,
      recentBiometrics: recentBio && recentBio.length > 0 ? {
        avgSleepScore: avgField(recentBio, 'sleep_score'),
        avgRecovery: avgField(recentBio, 'recovery_score'),
        avgHRV: avgField(recentBio, 'hrv'),
        avgRHR: avgField(recentBio, 'resting_heart_rate'),
        trajectory: recentBio[0]?.trajectory || 'unknown',
      } : undefined,
    });

    return NextResponse.json({
      success: true,
      insights: aiResponse,
      correlationCount: report.insights.length,
      pairedDays: report.totalPairedDays,
    });

  } catch (err: any) {
    console.error('AI insights error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
