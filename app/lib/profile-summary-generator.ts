// Generates a natural language summary of a user's sensitivity profile.
// Called after persistSensitivityProfile to write profile_summary.

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface SensitivityEntry {
  variable: string;
  sensitivity: 'high' | 'medium' | 'low';
  score: number;
}

interface Factor {
  pairId: string;
  name: string;
  sentence: string;
  confidence: string;
  percentDifference: number;
}

export async function generateAndStoreProfileSummary(
  userId: string,
  sensitivities: SensitivityEntry[],
  positiveFactors: Factor[],
  negativeFactors: Factor[],
  userGoal?: string
): Promise<string | null> {
  if (sensitivities.length === 0 && positiveFactors.length === 0 && negativeFactors.length === 0) {
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are summarizing a user's personal health sensitivity profile based on real data correlations.

User goal: ${userGoal || 'General wellness'}

Top sensitivities (how strongly this user reacts to each variable):
${sensitivities.slice(0, 8).map(s => `- ${s.variable}: ${s.sensitivity} sensitivity (score: ${s.score}/100)`).join('\n') || 'Not enough data yet'}

Positive factors (these are associated with better biometric outcomes):
${positiveFactors.slice(0, 4).map(f => `- ${f.sentence} [confidence: ${f.confidence}]`).join('\n') || 'None identified yet'}

Negative factors (these are associated with worse biometric outcomes):
${negativeFactors.slice(0, 4).map(f => `- ${f.sentence} [confidence: ${f.confidence}]`).join('\n') || 'None identified yet'}

RULES:
- Write a 2-3 sentence summary of this person's health patterns.
- Be specific, reference the data.
- Use cautious language: "tends to", "associated with", "appears to", "early data suggests".
- For medium-confidence findings, include a qualifier like "based on limited data" or "early patterns suggest".
- Do NOT give medical advice.
- Do NOT overstate findings. If most data is medium confidence, say "emerging patterns" not "strong patterns".
- Write in second person ("You tend to...").`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || null;

    if (summary) {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('user_sensitivity_profiles')
        .update({ profile_summary: summary })
        .eq('user_id', userId);
    }

    return summary;
  } catch (error) {
    console.error('[profile-summary] Failed to generate summary:', error);
    return null;
  }
}
