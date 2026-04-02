import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { exchangeCodeForTokens, saveWhoopConnection, fetchWhoopProfile } from '../../../lib/whoop';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // User denied access on WHOOP
    if (errorParam) {
      console.error('WHOOP OAuth error:', errorParam);
      return NextResponse.redirect(new URL('/profile?whoop=denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profile?whoop=error', request.url));
    }

    // Verify the logged-in user matches the state parameter
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login?redirectTo=/profile', request.url));
    }

    // Decode and verify state
    let stateData: { r: string; u: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(new URL('/profile?whoop=error', request.url));
    }

    if (stateData.u !== user.id) {
      console.error('WHOOP OAuth state mismatch: expected', user.id, 'got', stateData.u);
      return NextResponse.redirect(new URL('/profile?whoop=error', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get WHOOP user profile to store whoop_user_id
    let whoopUserId: string | undefined;
    try {
      const whoopProfile = await fetchWhoopProfile(tokens.access_token);
      whoopUserId = whoopProfile.user_id ? String(whoopProfile.user_id) : undefined;
    } catch (e) {
      console.warn('Could not fetch WHOOP profile:', e);
    }

    // Save connection under the authenticated user
    await saveWhoopConnection(user.id, tokens, whoopUserId);

    return NextResponse.redirect(new URL('/profile?whoop=connected', request.url));
  } catch (err: any) {
    console.error('WHOOP callback error:', err.message);
    return NextResponse.redirect(new URL('/profile?whoop=error', request.url));
  }
}
