import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { syncWhoopData } from '../../../lib/whoop';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await syncWhoopData(user.id);

    return NextResponse.json({
      success: true,
      message: 'WHOOP data synced successfully',
      synced: results,
    });
  } catch (err: any) {
    console.error('WHOOP sync error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to sync WHOOP data' },
      { status: 500 }
    );
  }
}
