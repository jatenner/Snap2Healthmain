// AI Insights Interpreter
// Takes pre-computed structured insights and generates plain-English explanations.
// The AI is a NARRATOR — it does NOT analyze, calculate, or invent.
// All data must originate from the Insight schema produced by insight-builder.ts.

import OpenAI from 'openai';
import { CorrelationReport, CorrelationResult } from './correlation-engine';
import type { Insight } from './insight-schema';

export interface AIInsightRequest {
  correlationReport: CorrelationReport;
  userProfile: {
    age: number;
    gender: string;
    weight: number;
    height: number;
    activityLevel: string;
    goal: string;
  };
  recentNutrition?: {
    avgCalories: number;
    avgProtein: number;
    avgFiber: number;
    topNutrientGaps: string[];
    daysLogged: number;
  };
  recentBiometrics?: {
    avgSleepScore: number;
    avgRecovery: number;
    avgHRV: number;
    avgRHR: number;
    trajectory: string;
  };
}

export interface AIInsightResponse {
  dailySummary: string;
  topPatternExplanation: string;
  recommendations: Array<{
    action: string;
    timeframe: string;
    expectedOutcome: string;
    confidence: 'low' | 'medium' | 'high';
  }>;
  experimentProposals: Array<{
    hypothesis: string;
    targetBehavior: string;
    durationDays: number;
    measurementField: string;
    expectedDirection: 'increase' | 'decrease';
  }>;
  nutrientFocus: string[];
  weeklySummary?: string;
}

export async function generateAIInsights(request: AIInsightRequest): Promise<AIInsightResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 });

  const { correlationReport, userProfile, recentNutrition, recentBiometrics } = request;

  // Build the structured input for the AI
  const insightsData = correlationReport.insights.slice(0, 10).map(i => ({
    pattern: i.pairName,
    highGroup: `${i.highGroup.avg} (n=${i.highGroup.n})`,
    lowGroup: `${i.lowGroup.avg} (n=${i.lowGroup.n})`,
    difference: `${i.difference} (${i.percentDifference}%)`,
    direction: i.direction,
    confidence: i.confidence,
    confounderControlled: i.confounderControlled,
    confounderWarning: i.confounderWarning || 'none',
    sentence: i.displaySentence,
  }));

  const prompt = `You are a health data interpreter for Snap2Health. You receive PRE-COMPUTED statistical patterns from a user's diet and biometric data. Your role is to explain these patterns in simple, actionable language.

RULES:
- NEVER claim causation. Use "associated with", "on days when", "pattern suggests", "tends to"
- NEVER invent or fabricate statistics — only reference numbers provided below
- NEVER give medical advice or diagnose conditions
- Speak like a smart coach, not a research paper
- Keep it concise and actionable
- All confidence levels are pre-computed — report them as given

USER PROFILE:
Age: ${userProfile.age}, Gender: ${userProfile.gender}, Weight: ${userProfile.weight}lbs, Goal: ${userProfile.goal}, Activity: ${userProfile.activityLevel}

${recentBiometrics ? `RECENT BIOMETRICS (7-day avg):
Sleep: ${recentBiometrics.avgSleepScore}%, Recovery: ${recentBiometrics.avgRecovery}%, HRV: ${recentBiometrics.avgHRV}ms, RHR: ${recentBiometrics.avgRHR}bpm, Trajectory: ${recentBiometrics.trajectory}` : 'No recent biometric data available.'}

${recentNutrition ? `RECENT NUTRITION (last ${recentNutrition.daysLogged} days avg):
Calories: ${recentNutrition.avgCalories}, Protein: ${recentNutrition.avgProtein}g, Fiber: ${recentNutrition.avgFiber}g
Top nutrient gaps: ${recentNutrition.topNutrientGaps.join(', ') || 'none identified'}` : 'Limited nutrition data — user needs to log more meals.'}

DETECTED PATTERNS (${correlationReport.insights.length} total, showing top ${insightsData.length}):
${insightsData.length > 0 ? JSON.stringify(insightsData, null, 2) : 'No patterns detected yet — insufficient overlapping meal and biometric data. User needs to log more meals consistently.'}

Total paired days of data: ${correlationReport.totalPairedDays}

Return a JSON response:
{
  "dailySummary": "2-3 sentence summary of current status and most important finding",
  "topPatternExplanation": "3-4 sentence plain-English explanation of the strongest pattern detected. If no patterns, explain what data is needed.",
  "recommendations": [
    {
      "action": "specific behavior to try",
      "timeframe": "how long to try it",
      "expectedOutcome": "what metric should improve",
      "confidence": "low|medium|high (from the underlying data)"
    }
  ],
  "experimentProposals": [
    {
      "hypothesis": "what we think is happening",
      "targetBehavior": "specific measurable behavior change",
      "durationDays": 7,
      "measurementField": "which biometric to track",
      "expectedDirection": "increase|decrease"
    }
  ],
  "nutrientFocus": ["top 3 nutrients this user should focus on based on gaps and patterns"],
  "weeklySummary": "optional weekly-level summary if enough data exists"
}

Provide 1-3 recommendations and 1-2 experiment proposals. If insufficient data, say so honestly and recommend logging more meals. Return ONLY valid JSON.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 1500,
    temperature: 0.2,
  });

  const responseContent = completion.choices[0]?.message?.content || '';
  let cleanResponse = responseContent.trim();

  if (cleanResponse.includes('```')) {
    const m = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (m?.[1]) cleanResponse = m[1];
  }

  const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback response if AI doesn't return valid JSON
    return {
      dailySummary: 'Unable to generate insights at this time. Log more meals to unlock personalized patterns.',
      topPatternExplanation: 'The system needs more overlapping meal and biometric data to detect meaningful patterns.',
      recommendations: [{
        action: 'Log your meals, beverages, and supplements consistently for the next 2 weeks',
        timeframe: '14 days',
        expectedOutcome: 'Enough data to detect diet-biometric patterns',
        confidence: 'high',
      }],
      experimentProposals: [],
      nutrientFocus: ['consistency in logging'],
    };
  }

  return JSON.parse(jsonMatch[0]) as AIInsightResponse;
}

// ============================================================================
// Phase 2: Structured Insight Narrator
// Accepts a pre-built Insight object and produces a plain-English summary.
// The LLM is a translator, not an analyst.
// ============================================================================

export async function narrateInsight(insight: Insight, context?: { mealTimeline?: string }): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20000 });

  // Build a compact representation of the structured data
  const factsText = insight.facts.map(f => `${f.label}: ${f.value}${f.unit ? ' ' + f.unit : ''} [${f.source}]`).join('\n');
  const scoresText = insight.scores.map(s => `${s.name}: ${s.value}/${s.max} — ${s.interpretation}`).join('\n');
  const patternsText = insight.patterns.length > 0
    ? insight.patterns.map(p => `• [${p.findingType}] ${p.description} (${p.effect}, confidence ${p.confidence}%, n=${p.sampleSize})`).join('\n')
    : 'No significant patterns detected.';
  const driversText = insight.drivers.length > 0
    ? insight.drivers.map(d => `• ${d.factor} → ${d.outcome} [${d.impact} impact, ${d.direction}]`).join('\n')
    : 'No drivers identified.';
  const recsText = insight.recommendations.length > 0
    ? insight.recommendations.map(r => `• ${r.action} — ${r.rationale} (confidence ${r.confidence}%)`).join('\n')
    : 'No specific recommendations.';

  // Hypothesis testing summary
  const hypotheses = insight.hypotheses || [];
  const helpfulCount = hypotheses.filter(h => h.findingType === 'helpful').length;
  const harmfulCount = hypotheses.filter(h => h.findingType === 'harmful').length;
  const neutralCount = hypotheses.filter(h => h.findingType === 'neutral').length;
  const insufficientCount = hypotheses.filter(h => h.findingType === 'insufficient_data').length;
  const hypothesesText = hypotheses.length > 0
    ? `Tested ${hypotheses.length} diet-biomarker hypotheses: ${helpfulCount} helpful, ${harmfulCount} harmful, ${neutralCount} no effect detected, ${insufficientCount} need more data.`
    : 'Not enough data to test hypotheses yet.';

  const timelineText = context?.mealTimeline
    ? `\nMEAL TIMELINE TODAY:\n${context.mealTimeline}\n`
    : '';

  const prompt = `STRUCTURED INSIGHT DATA (pre-computed, all numbers are final):

FACTS:
${factsText}
${timelineText}
SCORES:
${scoresText}

PATTERNS (significant findings only):
${patternsText}

HYPOTHESIS TESTING:
${hypothesesText}

KEY DRIVERS:
${driversText}

RECOMMENDATIONS:
${recsText}

CONFIDENCE: overall ${insight.confidence.overall}%, data quality ${insight.confidence.dataQuality}%, sample size ${insight.confidence.sampleSize} days, input confidence ${insight.confidence.inputConfidence}%

Return a JSON object with this EXACT structure:
{
  "headline": "1 sentence max — the single most important thing. Lead with the biometric, connect to the cause. E.g. 'Sleep dropped to 42% — late dinner at 9:45pm and 68g sugar likely disrupted glucose stability overnight.'",
  "body": "2-3 sentences explaining WHY through the physiological mechanism. E.g. 'High refined sugar before bed triggers a glucose spike followed by reactive hypoglycemia around 2-3am, which activates cortisol and fragments deep sleep. Your HRV dropped from 52ms to 38ms, consistent with elevated sympathetic drive.' If things are GOOD, explain why: 'The 42g protein from salmon provides tryptophan, a serotonin/melatonin precursor that supports sleep onset.'",
  "action": "1 specific thing to do. Name the food, the amount, and the expected effect. E.g. 'Add 100g leafy greens to dinner — the magnesium supports parasympathetic tone and should improve deep sleep within 2-3 days.'",
  "status": "good | mixed | poor | insufficient_data"
}

If data is insufficient, set status to "insufficient_data" and keep headline/body/action focused on what to log next.
Return ONLY valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutritional biochemist and performance health expert (think Peter Attia, Andrew Huberman). You are given pre-computed data from a user's diet and WHOOP biometrics. Your job is to REASON about the physiological mechanisms connecting what they ate to what happened in their body, then communicate it clearly.

YOU MUST:
- Explain the WHY using real biochemistry: glucose metabolism, insulin response, inflammatory cascades (IL-6, TNF-α), neurotransmitter pathways (tryptophan → serotonin → melatonin), autonomic nervous system (sympathetic vs parasympathetic), gut-brain axis, mTOR signaling, cortisol dynamics
- Lead with the biometric finding (WHOOP data), then connect to diet through the mechanism
- Reference specific meals and times from the data: "dinner at 9:45pm", "caffeine at 3:15pm"
- When things are BAD, explain the chain: "68g sugar → glucose spike → insulin surge → reactive hypoglycemia at 2am → cortisol release → fragmented sleep architecture"
- When things are GOOD, explain what worked: "Salmon's EPA/DHA reduced inflammatory markers, tryptophan from the protein supported melatonin synthesis → deeper slow-wave sleep"
- When diet looks fine but biometrics are bad, reason about other causes: training strain, travel, illness, sleep environment
- Be honest about confidence: distinguish "strong pattern in your data + established science" from "possible but only 3 data points"
- All numbers come from the data provided. Do NOT invent statistics.
- Return ONLY valid JSON in the requested format.`,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.15,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    // Try to parse JSON response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // Return as JSON string so caller can parse structured insight
        return JSON.stringify(parsed);
      } catch {
        return raw;
      }
    }
    return raw;
  } catch (e) {
    console.error('[narrateInsight] LLM call failed:', e);
    const topScore = insight.scores[0];
    const topRec = insight.recommendations[0];
    const fallback = {
      headline: topScore ? `${topScore.name}: ${topScore.interpretation}` : 'Log more meals to unlock insights.',
      body: topRec ? topRec.action : 'Keep logging to build your dietary profile.',
      action: 'Log your next meal to help build your pattern history.',
      status: 'insufficient_data',
    };
    return JSON.stringify(fallback);
  }
}
