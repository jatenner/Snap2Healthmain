import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { maybeRefreshCorrelations } from '../../lib/auto-refresh';
import { maybeAutoSyncWhoop } from '../../lib/whoop-auto-sync';
import { autoLogRecurringHabits } from '../../lib/recurring-habits';
import { getPersonalizationStatus } from '../../lib/personalization-status';
import { getUserTimezone, getTodayInTimezone } from '../../lib/timezone-utils';
import { buildInsight } from '../../lib/insight-builder';
import { narrateInsight } from '../../lib/ai-insights-interpreter';
import { buildNutritionHistory } from '../../lib/recommendation-history';
import { loadSignalMemory, syncSignalMemory } from '../../lib/signal-memory';

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

    // Use the user's timezone to determine "today" — prevents day-boundary mismatches
    const userTimezone = getUserTimezone(request.headers);
    const today = getTodayInTimezone(userTimezone);
    const userId = user.id;

    // Fetch all data in parallel
    const [
      biometricResult,
      nutritionResult,
      mealsResult,
      correlationResult,
      profileResult,
      experimentResult,
      recentNutritionResult,
    ] = await Promise.all([
      // Today's biometric summary
      admin.from('daily_biometric_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', today)
        .single(),
      // Today's nutrition summary
      admin.from('daily_nutrition_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', today)
        .single(),
      // Today's meals
      admin.from('meals')
        .select('id, meal_name, calories, protein, carbs, fat, meal_time, meal_tags, image_url, confidence_score')
        .eq('user_id', userId)
        .gte('meal_time', `${today}T00:00:00`)
        .lt('meal_time', `${today}T23:59:59.999`)
        .order('meal_time', { ascending: true }),
      // Cached correlation report
      admin.from('correlation_reports')
        .select('report_data, generated_at')
        .eq('user_id', userId)
        .single(),
      // User profile
      admin.from('profiles')
        .select('full_name, age, gender, goal, activity_level')
        .eq('id', userId)
        .single(),
      // Active experiment (if any)
      admin.from('health_experiments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single(),
      // Recent nutrition summaries (last 14 days) for recommendation history
      admin.from('daily_nutrition_summaries')
        .select('pct_dv_protein, pct_dv_fiber, pct_dv_magnesium, pct_dv_vitamin_d, pct_dv_iron, pct_dv_calcium, pct_dv_zinc, caffeine_after_2pm, has_late_night_meal, inflammatory_score, nutrient_adequacy_score, summary_date')
        .eq('user_id', userId)
        .lt('summary_date', today)
        .order('summary_date', { ascending: false })
        .limit(14),
    ]);

    const biometric = biometricResult.data;
    const nutrition = nutritionResult.data;
    const meals = mealsResult.data || [];
    const correlationReport = correlationResult.data?.report_data;
    const profile = profileResult.data;

    // Build the hero insight — outcome-first if available, single-variable fallback
    let heroInsight: any = null;
    if (correlationReport?.outcomeAnalyses?.length > 0) {
      // Use the top outcome analysis (outcome that needs attention most)
      const topOutcome = correlationReport.outcomeAnalyses[0];
      const topDriver = topOutcome.primaryDrivers?.[0];
      heroInsight = {
        title: topOutcome.statusDetail,
        sentence: topDriver
          ? `Strongest pattern: ${topDriver.factor.toLowerCase()}. ${topDriver.evidenceStrength === 'strong' ? 'This is a strong signal in your data.' : 'This is a possible contributor based on your patterns.'}`
          : topOutcome.statusDetail,
        confidence: topDriver?.evidenceStrength === 'strong' ? 'high' : topDriver?.evidenceStrength === 'moderate' ? 'medium' : 'low',
        direction: topOutcome.status === 'good' ? 'better' : 'worse',
        category: topOutcome.outcomeLabel,
        primaryDrivers: topOutcome.primaryDrivers?.map((d: any) => d.factor),
        supportingSignals: topOutcome.supportingSignals?.map((d: any) => d.factor),
        recommendedAction: topOutcome.recommendedTest?.action,
      };
    } else if (correlationReport?.insights?.length > 0) {
      // Fallback to single-variable top insight
      const top = correlationReport.insights[0];
      heroInsight = {
        title: top.pairName,
        sentence: top.displaySentence,
        confidence: top.confidence,
        direction: top.direction,
        category: top.category,
      };
    }

    // Build today's recommendation — outcome-first, then nutrient gaps
    let recommendation: string | null = null;

    // First: use outcome analysis recommended test if available
    if (correlationReport?.outcomeAnalyses?.length > 0) {
      const topOutcome = correlationReport.outcomeAnalyses[0];
      if (topOutcome.recommendedTest && topOutcome.status !== 'good') {
        recommendation = topOutcome.recommendedTest.action;
      }
    }

    // Second: nutrient gap recommendations if no outcome-based rec
    if (!recommendation && nutrition) {
      const gaps: string[] = [];
      if ((nutrition.pct_dv_magnesium || 0) < 50) gaps.push('magnesium');
      if ((nutrition.pct_dv_vitamin_d || 0) < 50) gaps.push('vitamin D');
      if ((nutrition.pct_dv_fiber || 0) < 50) gaps.push('fiber');
      if ((nutrition.pct_dv_iron || 0) < 50) gaps.push('iron');
      if ((nutrition.pct_dv_protein || 0) < 50) gaps.push('protein');

      if (gaps.length > 0) {
        const topGap = gaps[0]!;
        const foodSuggestions: Record<string, string> = {
          magnesium: 'dark chocolate, spinach, almonds, or avocado',
          'vitamin D': 'salmon, eggs, or fortified foods',
          fiber: 'beans, berries, broccoli, or oats',
          iron: 'red meat, spinach, lentils, or fortified cereal',
          protein: 'chicken, fish, eggs, or Greek yogurt',
        };
        recommendation = `You're low on ${topGap} today. Try adding ${foodSuggestions[topGap] || 'nutrient-rich foods'} to your next meal.`;
      }
    }
    if (!recommendation && biometric) {
      if ((biometric.recovery_score || 0) < 50) {
        recommendation = 'Recovery is low today. Focus on anti-inflammatory foods, hydration, and an earlier, lighter dinner.';
      } else if ((biometric.sleep_score || 0) < 70) {
        recommendation = 'Sleep was below average. Consider reducing caffeine after 2pm and keeping dinner lighter tonight.';
      }
    }

    // Build nutrient gaps list
    const nutrientGaps: Array<{ name: string; pct: number }> = [];
    if (nutrition) {
      const checks = [
        { name: 'Protein', pct: nutrition.pct_dv_protein },
        { name: 'Fiber', pct: nutrition.pct_dv_fiber },
        { name: 'Magnesium', pct: nutrition.pct_dv_magnesium },
        { name: 'Vitamin D', pct: nutrition.pct_dv_vitamin_d },
        { name: 'Iron', pct: nutrition.pct_dv_iron },
        { name: 'Calcium', pct: nutrition.pct_dv_calcium },
        { name: 'Potassium', pct: nutrition.pct_dv_potassium },
        { name: 'Zinc', pct: nutrition.pct_dv_zinc },
        { name: 'Vitamin C', pct: nutrition.pct_dv_vitamin_c },
        { name: 'Vitamin B12', pct: nutrition.pct_dv_vitamin_b12 },
      ];
      for (const c of checks) {
        if (c.pct != null && c.pct < 60) {
          nutrientGaps.push({ name: c.name, pct: Math.round(c.pct) });
        }
      }
      nutrientGaps.sort((a, b) => a.pct - b.pct);
    }

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || '';

    // Compute personalization status from profile data
    const personalizationStatus = getPersonalizationStatus(
      profile || user.user_metadata || null
    );

    // ====== Build structured insight with recommendation history ======
    const recentNutrition = recentNutritionResult.data || [];
    const history = buildNutritionHistory(recentNutrition);

    // Load persistent signal memory for outcome tracking
    let persistedSignals: any[] = [];
    try {
      persistedSignals = await loadSignalMemory(userId);
    } catch (e) {
      console.warn('[today] Signal memory load failed (table may not exist yet):', (e as Error).message);
    }

    // Compute average meal confidence from today's meals
    const mealConfidences = meals.filter((m: any) => m.confidence_score != null).map((m: any) => m.confidence_score as number);
    const avgMealConfidence = mealConfidences.length > 0
      ? Math.round(mealConfidences.reduce((a: number, b: number) => a + b, 0) / mealConfidences.length)
      : null;

    const insight = buildInsight(
      nutrition,
      biometric,
      correlationReport || null,
      avgMealConfidence,
      history,
      profile?.goal,
      persistedSignals,
    );

    // Sync today's signals into persistent memory (fire-and-forget)
    if (history.length > 0) {
      syncSignalMemory(userId, today, history).catch(e =>
        console.warn('[today] Signal memory sync failed:', (e as Error).message)
      );
    }

    // Build meal timeline with specific times (for biomarker-LED insight narration)
    const mealTimeline = meals.length > 0
      ? meals.map((m: any) => {
          const time = new Date(m.meal_time).toLocaleTimeString('en-US', {
            timeZone: userTimezone, hour: 'numeric', minute: '2-digit', hour12: true,
          });
          const extras: string[] = [];
          if (m.protein) extras.push(`${m.protein}g protein`);
          // Check for caffeine in the meal name or tags
          if (m.meal_tags?.includes('contains_caffeine')) extras.push('caffeine');
          if (m.meal_tags?.includes('contains_alcohol')) extras.push('alcohol');
          return `${m.meal_name} at ${time} (${m.calories} cal${extras.length ? ', ' + extras.join(', ') : ''})`;
        }).join('; ')
      : '';

    // Generate LLM narrative from structured insight + meal timing
    let narrative = '';
    if (insight.facts.length > 0) {
      try {
        narrative = await narrateInsight(insight, { mealTimeline });
      } catch (e) {
        console.warn('[today] Narrative generation failed, using fallback');
        const topRec = insight.recommendations[0];
        narrative = topRec ? topRec.action : '';
      }
    }

    return NextResponse.json({
      greeting: `${greeting}${firstName ? ', ' + firstName : ''}.`,
      goal: profile?.goal || 'General Wellness',

      // Phase 2: Structured insight + narrative
      insight,
      narrative,

      // Personalization transparency
      personalizationStatus,

      // Body status (4 cards) — source: user_data (from WHOOP device)
      biometric: biometric ? {
        sleepScore: biometric.sleep_score,
        recoveryScore: biometric.recovery_score,
        hrv: biometric.hrv ? Math.round(biometric.hrv * 10) / 10 : null,
        strain: biometric.strain ? Math.round(biometric.strain * 10) / 10 : null,
        sleepDeviation: biometric.sleep_deviation,
        recoveryDeviation: biometric.recovery_deviation,
        hrvDeviation: biometric.hrv_deviation,
        dayQuality: biometric.day_quality,
        trajectory: biometric.trajectory,
        _source: 'user_data',
      } : null,

      // Nutrition status — source: ai_estimate (GPT-4o derived values, computed scores)
      nutrition: nutrition ? {
        totalCalories: Math.round(nutrition.total_calories),
        totalProtein: Math.round(nutrition.total_protein),
        totalCarbs: Math.round(nutrition.total_carbs),
        totalFat: Math.round(nutrition.total_fat),
        mealCount: nutrition.meal_count,
        nutrientAdequacy: nutrition.nutrient_adequacy_score,
        inflammatoryScore: nutrition.inflammatory_score,
        nutrientGaps: nutrientGaps.slice(0, 3),
        _source: 'ai_estimate',
        _nutrientAdequacySource: 'computed',
        _inflammatorySource: 'computed',
      } : {
        totalCalories: meals.reduce((s: number, m: any) => s + (m.calories || 0), 0),
        totalProtein: meals.reduce((s: number, m: any) => s + (m.protein || 0), 0),
        totalCarbs: meals.reduce((s: number, m: any) => s + (m.carbs || 0), 0),
        totalFat: meals.reduce((s: number, m: any) => s + (m.fat || 0), 0),
        mealCount: meals.length,
        nutrientAdequacy: null,
        inflammatoryScore: null,
        nutrientGaps: [],
        _source: 'ai_estimate',
      },

      // Hero insight — source: computed (from correlation engine)
      heroInsight: heroInsight ? { ...heroInsight, _source: 'computed' } : null,

      // Recommendation — source varies
      recommendation: recommendation ? {
        text: recommendation,
        _source: heroInsight ? 'computed' : 'ai_interpretation',
      } : null,

      // Today's meals (timeline)
      meals: meals.map((m: any) => ({
        id: m.id,
        name: m.meal_name,
        calories: m.calories,
        time: m.meal_time,
        tags: m.meal_tags || [],
        hasImage: !!m.image_url,
      })),

      // Data status — tells the UI what's missing
      dataStatus: {
        hasBiometrics: !!biometric,
        hasNutritionToday: meals.length > 0,
        hasCorrelations: (correlationReport?.insights?.length || 0) > 0,
        pairedDays: correlationReport?.totalPairedDays || 0,
        neededForInsights: 10,
        biometricDays: correlationReport?.dataQuality?.fullDays != null
          ? (correlationReport.dataQuality.fullDays + (correlationReport.dataQuality.partialDays || 0))
          : null,
      },

      // Active experiment
      experiment: experimentResult.data ? {
        id: experimentResult.data.id,
        title: experimentResult.data.title,
        hypothesis: experimentResult.data.hypothesis,
        targetBehavior: experimentResult.data.target_behavior,
        durationDays: experimentResult.data.duration_days,
        startDate: experimentResult.data.start_date,
        endDate: experimentResult.data.end_date,
        status: experimentResult.data.status,
      } : null,

      // Data freshness info
      correlationAge: correlationResult.data?.generated_at
        ? Math.round((Date.now() - new Date(correlationResult.data.generated_at).getTime()) / (1000 * 60 * 60))
        : null,
    });

    // Fire-and-forget background tasks
    autoLogRecurringHabits(userId).catch(e =>
      console.error('[today] Background habit logging error:', e)
    );
    maybeAutoSyncWhoop(userId).catch(e =>
      console.error('[today] Background WHOOP sync error:', e)
    );
    maybeRefreshCorrelations(userId).catch(e =>
      console.error('[today] Background correlation refresh error:', e)
    );

  } catch (err: any) {
    console.error('Today API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
