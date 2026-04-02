import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getWhoopConnectionStatus } from '../../../lib/whoop';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getWhoopConnectionStatus(user.id);
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('WHOOP status error:', err.message);
    return NextResponse.json({ error: 'Failed to check WHOOP status' }, { status: 500 });
  }
}
