import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { exchangeCodeForTokens, saveWhoopConnection, fetchWhoopProfile, syncWhoopProfileToSnap2Health } from '../../../lib/whoop';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Get the public-facing base URL (Railway runs behind a proxy)
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  // Fallback: derive from WHOOP_REDIRECT_URI
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  if (redirectUri) {
    const url = new URL(redirectUri);
    return url.origin;
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('WHOOP OAuth error:', errorParam);
      return NextResponse.redirect(`${baseUrl}/profile?whoop=denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/profile?whoop=error`);
    }

    // Verify state from cookie (CSRF protection)
    const cookieStore = cookies();
    const oauthCookie = cookieStore.get('whoop_oauth_state');
    if (!oauthCookie?.value) {
      console.error('WHOOP OAuth: missing state cookie');
      return NextResponse.redirect(`${baseUrl}/profile?whoop=error`);
    }

    let storedState: { state: string; userId: string };
    try {
      storedState = JSON.parse(oauthCookie.value);
    } catch {
      return NextResponse.redirect(`${baseUrl}/profile?whoop=error`);
    }

    if (storedState.state !== state) {
      console.error('WHOOP OAuth state mismatch');
      return NextResponse.redirect(`${baseUrl}/profile?whoop=error`);
    }

    // Also verify the user is still logged in
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== storedState.userId) {
      return NextResponse.redirect(`${baseUrl}/login?redirectTo=/profile`);
    }

    // Clean up the state cookie
    cookieStore.set('whoop_oauth_state', '', { maxAge: 0, path: '/' });

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

    // Auto-fill profile height/weight from WHOOP if empty
    await syncWhoopProfileToSnap2Health(user.id, tokens.access_token);

    return NextResponse.redirect(`${baseUrl}/profile?whoop=connected`);
  } catch (err: any) {
    console.error('WHOOP callback error:', err.message);
    return NextResponse.redirect(`${baseUrl}/profile?whoop=error`);
  }
}
