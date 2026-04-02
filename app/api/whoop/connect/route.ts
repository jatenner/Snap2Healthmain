import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { buildAuthorizationUrl } from '../../../lib/whoop';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // WHOOP requires state to be exactly 8 characters
    const state = randomBytes(4).toString('hex'); // 8 hex chars

    // Store state + user ID in a secure httpOnly cookie for verification in callback
    const cookieStore = cookies();
    cookieStore.set('whoop_oauth_state', JSON.stringify({ state, userId: user.id }), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    const authUrl = buildAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('WHOOP connect error:', err.message);
    return NextResponse.json({ error: 'Failed to initiate WHOOP connection' }, { status: 500 });
  }
}
