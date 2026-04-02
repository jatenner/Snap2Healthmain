import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { createExperiment, getExperiments, completeExperiment } from '../../lib/experiment-engine';

export const dynamic = 'force-dynamic';

// GET: list all experiments for the user
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const experiments = await getExperiments(user.id);
    return NextResponse.json({ experiments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create new experiment or complete existing one
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Complete an experiment
    if (body.action === 'complete' && body.experimentId) {
      const result = await completeExperiment(body.experimentId, user.id);
      return NextResponse.json({ success: true, result });
    }

    // Create new experiment
    const { title, hypothesis, targetBehavior, measurementField, expectedDirection, durationDays } = body;
    if (!title || !hypothesis || !targetBehavior || !measurementField || !expectedDirection) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const experiment = await createExperiment(user.id, {
      title, hypothesis, targetBehavior, measurementField, expectedDirection,
      durationDays: durationDays || 7,
      sourceCorrelationId: body.sourceCorrelationId,
    });

    return NextResponse.json({ success: true, experimentId: experiment.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
