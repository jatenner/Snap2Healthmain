// Experiment Engine: Create, track, and evaluate health experiments
// Connects correlation insights → testable behavior changes → measured outcomes

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface CreateExperimentParams {
  title: string;
  hypothesis: string;
  targetBehavior: string;
  measurementField: string;       // e.g., 'sleep_score', 'recovery_score', 'hrv'
  expectedDirection: 'increase' | 'decrease';
  durationDays?: number;
  sourceCorrelationId?: string;
}

export interface ExperimentWithLogs {
  id: string;
  title: string;
  hypothesis: string;
  targetBehavior: string;
  measurementField: string;
  expectedDirection: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  baselineValue: number | null;
  baselineN: number | null;
  status: string;
  logs: Array<{
    date: string;
    compliant: boolean | null;
    measurementValue: number | null;
  }>;
  result?: {
    experimentAvg: number;
    baselineAvg: number;
    difference: number;
    percentChange: number;
    complianceRate: number;
    outcome: string;
    confidence: string;
    summary: string;
  };
}

export async function createExperiment(userId: string, params: CreateExperimentParams) {
  const supabase = getSupabaseAdmin();
  const durationDays = params.durationDays || 7;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  // Compute baseline: average of measurement field for the last 14 days
  const baselineStart = new Date();
  baselineStart.setDate(baselineStart.getDate() - 14);

  const { data: baselineDays } = await supabase
    .from('daily_biometric_summaries')
    .select(params.measurementField)
    .eq('user_id', userId)
    .gte('summary_date', baselineStart.toISOString().split('T')[0]!)
    .lt('summary_date', startDate.toISOString().split('T')[0]!);

  let baselineValue: number | null = null;
  let baselineN = 0;
  if (baselineDays && baselineDays.length > 0) {
    const vals = baselineDays.map((d: any) => d[params.measurementField]).filter((v: any) => v != null);
    baselineN = vals.length;
    if (vals.length > 0) {
      baselineValue = Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10;
    }
  }

  const { data, error } = await supabase
    .from('health_experiments')
    .insert({
      user_id: userId,
      title: params.title,
      hypothesis: params.hypothesis,
      target_behavior: params.targetBehavior,
      measurement_field: params.measurementField,
      expected_direction: params.expectedDirection,
      duration_days: durationDays,
      start_date: startDate.toISOString().split('T')[0]!,
      end_date: endDate.toISOString().split('T')[0]!,
      baseline_value: baselineValue,
      baseline_n: baselineN,
      status: 'active',
      source_correlation_id: params.sourceCorrelationId || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create experiment: ${error.message}`);
  return data;
}

export async function getExperiments(userId: string): Promise<ExperimentWithLogs[]> {
  const supabase = getSupabaseAdmin();

  const { data: experiments } = await supabase
    .from('health_experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!experiments || experiments.length === 0) return [];

  const results: ExperimentWithLogs[] = [];

  for (const exp of experiments) {
    // Fetch logs
    const { data: logs } = await supabase
      .from('experiment_daily_logs')
      .select('log_date, compliant, measurement_value')
      .eq('experiment_id', exp.id)
      .order('log_date', { ascending: true });

    // Fetch result if completed
    const { data: result } = await supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', exp.id)
      .single();

    results.push({
      id: exp.id,
      title: exp.title,
      hypothesis: exp.hypothesis,
      targetBehavior: exp.target_behavior,
      measurementField: exp.measurement_field,
      expectedDirection: exp.expected_direction,
      durationDays: exp.duration_days,
      startDate: exp.start_date,
      endDate: exp.end_date,
      baselineValue: exp.baseline_value,
      baselineN: exp.baseline_n,
      status: exp.status,
      logs: (logs || []).map((l: any) => ({
        date: l.log_date,
        compliant: l.compliant,
        measurementValue: l.measurement_value,
      })),
      result: result ? {
        experimentAvg: result.experiment_avg,
        baselineAvg: result.baseline_avg,
        difference: result.difference,
        percentChange: result.percent_change,
        complianceRate: result.compliance_rate,
        outcome: result.outcome,
        confidence: result.confidence,
        summary: result.summary,
      } : undefined,
    });
  }

  return results;
}

export async function completeExperiment(experimentId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: exp } = await supabase
    .from('health_experiments')
    .select('*')
    .eq('id', experimentId)
    .eq('user_id', userId)
    .single();

  if (!exp) throw new Error('Experiment not found');

  // Fetch daily logs
  const { data: logs } = await supabase
    .from('experiment_daily_logs')
    .select('*')
    .eq('experiment_id', experimentId);

  const compliantDays = (logs || []).filter((l: any) => l.compliant === true).length;
  const totalDays = (logs || []).length;
  const complianceRate = totalDays > 0 ? Math.round((compliantDays / totalDays) * 100) : 0;

  // Get measurement values during experiment
  const { data: bioDays } = await supabase
    .from('daily_biometric_summaries')
    .select(exp.measurement_field)
    .eq('user_id', userId)
    .gte('summary_date', exp.start_date)
    .lte('summary_date', exp.end_date);

  const vals = (bioDays || []).map((d: any) => d[exp.measurement_field]).filter((v: any) => v != null);
  const experimentAvg = vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
  const baselineAvg = exp.baseline_value || 0;
  const difference = Math.round((experimentAvg - baselineAvg) * 10) / 10;
  const percentChange = baselineAvg > 0 ? Math.round((difference / baselineAvg) * 1000) / 10 : 0;

  // Determine outcome
  let outcome = 'no_change';
  const improved = exp.expected_direction === 'increase' ? difference > 0 : difference < 0;
  if (Math.abs(percentChange) >= 3) {
    outcome = improved ? 'improved' : 'worsened';
  }

  let confidence = 'low';
  if (complianceRate >= 70 && vals.length >= 5 && Math.abs(percentChange) >= 5) confidence = 'high';
  else if (complianceRate >= 50 && vals.length >= 3 && Math.abs(percentChange) >= 3) confidence = 'medium';

  const summary = outcome === 'improved'
    ? `${exp.measurement_field.replace(/_/g, ' ')} ${exp.expected_direction === 'increase' ? 'improved' : 'decreased'} by ${Math.abs(percentChange)}% during the experiment (${experimentAvg} vs ${baselineAvg} baseline). Compliance: ${complianceRate}%.`
    : outcome === 'worsened'
    ? `${exp.measurement_field.replace(/_/g, ' ')} moved opposite to expected direction. Baseline: ${baselineAvg}, during experiment: ${experimentAvg}. This hypothesis may not apply to you.`
    : `No significant change in ${exp.measurement_field.replace(/_/g, ' ')} during the experiment (${experimentAvg} vs ${baselineAvg} baseline). More data or a longer test may be needed.`;

  // Save result
  await supabase.from('experiment_results').upsert({
    experiment_id: experimentId,
    user_id: userId,
    experiment_avg: experimentAvg,
    baseline_avg: baselineAvg,
    difference,
    percent_change: percentChange,
    compliance_rate: complianceRate,
    outcome,
    confidence,
    summary,
  }, { onConflict: 'experiment_id' });

  // Mark experiment as completed
  await supabase.from('health_experiments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', experimentId);

  return { outcome, confidence, summary, experimentAvg, baselineAvg, difference, percentChange, complianceRate };
}
