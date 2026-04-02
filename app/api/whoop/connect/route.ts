import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { buildAuthorizationUrl } from '../../../lib/whoop';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a state parameter that encodes the user ID for CSRF protection
    // Format: random_bytes:user_id (verified in callback)
    const random = randomBytes(16).toString('hex');
    const state = Buffer.from(JSON.stringify({ r: random, u: user.id })).toString('base64url');

    const authUrl = buildAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('WHOOP connect error:', err.message);
    return NextResponse.json({ error: 'Failed to initiate WHOOP connection' }, { status: 500 });
  }
}
