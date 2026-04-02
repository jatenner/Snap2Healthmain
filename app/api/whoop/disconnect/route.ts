import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { deleteWhoopConnection } from '../../../lib/whoop';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteWhoopConnection(user.id);

    return NextResponse.json({ success: true, message: 'WHOOP disconnected' });
  } catch (err: any) {
    console.error('WHOOP disconnect error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to disconnect WHOOP' },
      { status: 500 }
    );
  }
}
