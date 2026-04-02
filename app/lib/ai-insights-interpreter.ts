// AI Insights Interpreter
// Takes pre-computed correlation results and generates plain-English explanations.
// The AI interprets — it does NOT calculate. All statistics are pre-computed.

import OpenAI from 'openai';
import { CorrelationReport, CorrelationResult } from './correlation-engine';

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
