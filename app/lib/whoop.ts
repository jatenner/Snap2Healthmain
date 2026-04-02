import { createClient } from '@supabase/supabase-js';

// WHOOP OAuth & API configuration
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v1';

const WHOOP_SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:workout',
  'read:profile',
  'read:body_measurement',
  'offline',
].join(' ');

function getWhoopConfig() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing WHOOP environment variables (WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI)');
  }
  return { clientId, clientSecret, redirectUri };
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Build the WHOOP authorization URL for OAuth redirect
export function buildAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getWhoopConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: WHOOP_SCOPES,
    state,
  });
  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getWhoopConfig();

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
    scope: data.scope as string,
  };
}

// Refresh an expired access token
export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getWhoopConfig();

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'offline',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
    scope: data.scope as string,
  };
}

// Get a valid access token for a user, refreshing if needed
export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; connectionId: string }> {
  const supabase = getSupabaseAdmin();

  const { data: conn, error } = await supabase
    .from('whoop_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !conn) {
    throw new Error('No WHOOP connection found for this user');
  }

  const now = new Date();
  const expiresAt = new Date(conn.token_expires_at);

  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const tokens = await refreshAccessToken(conn.refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await supabase
      .from('whoop_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: newExpiresAt.toISOString(),
        scopes: tokens.scope,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conn.id);

    return { accessToken: tokens.access_token, connectionId: conn.id };
  }

  return { accessToken: conn.access_token, connectionId: conn.id };
}

// Generic WHOOP API fetch with auth
async function whoopFetch(accessToken: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${WHOOP_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP API error ${res.status} on ${path}: ${text}`);
  }

  return res.json();
}

// Fetch paginated WHOOP data (handles next_token pagination)
async function whoopFetchAll(accessToken: string, path: string, limit = 25): Promise<any[]> {
  const allRecords: any[] = [];
  let nextToken: string | undefined;

  do {
    const params: Record<string, string> = { limit: String(limit) };
    if (nextToken) params.nextToken = nextToken;

    const data = await whoopFetch(accessToken, path, params);
    if (data.records && Array.isArray(data.records)) {
      allRecords.push(...data.records);
    }
    nextToken = data.next_token;
  } while (nextToken);

  return allRecords;
}

// Fetch WHOOP user profile
export async function fetchWhoopProfile(accessToken: string) {
  return whoopFetch(accessToken, '/user/profile/basic');
}

// Fetch WHOOP body measurements (height, weight, max HR)
export async function fetchWhoopBodyMeasurements(accessToken: string) {
  return whoopFetch(accessToken, '/user/body_measurement');
}

// Auto-fill Snap2Health profile from WHOOP body measurements
export async function syncWhoopProfileToSnap2Health(userId: string, accessToken: string) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await fetchWhoopBodyMeasurements(accessToken);
    if (!body) return;

    const updates: Record<string, any> = {};

    // WHOOP returns height in meters, we store in inches
    if (body.height_meter) {
      updates.height = String(Math.round(body.height_meter * 39.3701 * 10) / 10);
      updates.height_unit = 'in';
    }
    // WHOOP returns weight in kg, we store as number with unit
    if (body.weight_kilogram) {
      updates.weight = Math.round(body.weight_kilogram * 2.20462 * 10) / 10;
      updates.weight_unit = 'lbs';
    }

    if (Object.keys(updates).length > 0) {
      // Only update empty fields — don't overwrite user's manual entries
      const { data: profile } = await supabase
        .from('profiles')
        .select('height, weight')
        .eq('id', userId)
        .single();

      const finalUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (!profile?.height && updates.height) {
        finalUpdates.height = updates.height;
        finalUpdates.height_unit = updates.height_unit;
      }
      if (!profile?.weight && updates.weight) {
        finalUpdates.weight = updates.weight;
        finalUpdates.weight_unit = updates.weight_unit;
      }

      if (Object.keys(finalUpdates).length > 1) {
        await supabase.from('profiles').update(finalUpdates).eq('id', userId);
      }
    }
  } catch (e) {
    console.warn('Could not sync WHOOP body measurements to profile:', e);
  }
}

// Save WHOOP connection to database
export async function saveWhoopConnection(
  userId: string,
  tokens: { access_token: string; refresh_token: string; expires_in: number; scope: string },
  whoopUserId?: string
) {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const { error } = await supabase
    .from('whoop_connections')
    .upsert(
      {
        user_id: userId,
        whoop_user_id: whoopUserId || null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(`Failed to save WHOOP connection: ${error.message}`);
}

// Get WHOOP connection status for a user (safe for frontend - no tokens)
export async function getWhoopConnectionStatus(userId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('whoop_connections')
    .select('id, whoop_user_id, last_sync_at, created_at, scopes')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { connected: false };

  return {
    connected: true,
    whoopUserId: data.whoop_user_id,
    lastSyncAt: data.last_sync_at,
    connectedAt: data.created_at,
    scopes: data.scopes,
  };
}

// Delete WHOOP connection for a user
export async function deleteWhoopConnection(userId: string) {
  const supabase = getSupabaseAdmin();

  // Delete synced data first
  await Promise.all([
    supabase.from('whoop_sleep').delete().eq('user_id', userId),
    supabase.from('whoop_recovery').delete().eq('user_id', userId),
    supabase.from('whoop_cycles').delete().eq('user_id', userId),
    supabase.from('whoop_workouts').delete().eq('user_id', userId),
  ]);

  const { error } = await supabase
    .from('whoop_connections')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete WHOOP connection: ${error.message}`);
}

// ─── Sync Functions ───────────────────────────────────────────────────────────

export async function syncWhoopData(userId: string) {
  const { accessToken, connectionId } = await getValidAccessToken(userId);
  const supabase = getSupabaseAdmin();

  const results = { sleep: 0, recovery: 0, cycles: 0, workouts: 0 };

  // Sync all data types in parallel
  const [sleepRecords, cycleRecords, workoutRecords] = await Promise.all([
    whoopFetchAll(accessToken, '/activity/sleep').catch((e) => {
      console.error('WHOOP sleep sync error:', e.message);
      return [];
    }),
    whoopFetchAll(accessToken, '/cycle').catch((e) => {
      console.error('WHOOP cycle sync error:', e.message);
      return [];
    }),
    whoopFetchAll(accessToken, '/activity/workout').catch((e) => {
      console.error('WHOOP workout sync error:', e.message);
      return [];
    }),
  ]);

  // Process sleep records
  if (sleepRecords.length > 0) {
    const sleepRows = sleepRecords.map((s: any) => ({
      user_id: userId,
      whoop_sleep_id: String(s.id),
      whoop_cycle_id: s.cycle_id ? String(s.cycle_id) : null,
      start_time: s.start,
      end_time: s.end,
      is_nap: s.nap || false,
      score_state: s.score_state,
      sleep_performance_pct: s.score?.sleep_performance_percentage,
      sleep_consistency_pct: s.score?.sleep_consistency_percentage,
      sleep_efficiency_pct: s.score?.sleep_efficiency_percentage,
      respiratory_rate: s.score?.respiratory_rate,
      total_in_bed_minutes: s.score?.stage_summary?.total_in_bed_time_milli
        ? Math.round(s.score.stage_summary.total_in_bed_time_milli / 60000)
        : null,
      total_awake_minutes: s.score?.stage_summary?.total_awake_time_milli
        ? Math.round(s.score.stage_summary.total_awake_time_milli / 60000)
        : null,
      total_light_sleep_minutes: s.score?.stage_summary?.total_light_sleep_time_milli
        ? Math.round(s.score.stage_summary.total_light_sleep_time_milli / 60000)
        : null,
      total_slow_wave_sleep_minutes: s.score?.stage_summary?.total_slow_wave_sleep_time_milli
        ? Math.round(s.score.stage_summary.total_slow_wave_sleep_time_milli / 60000)
        : null,
      total_rem_sleep_minutes: s.score?.stage_summary?.total_rem_sleep_time_milli
        ? Math.round(s.score.stage_summary.total_rem_sleep_time_milli / 60000)
        : null,
      baseline_sleep_needed_ms: s.score?.sleep_needed?.baseline_milli,
      need_from_sleep_debt_ms: s.score?.sleep_needed?.need_from_sleep_debt_milli,
      need_from_strain_ms: s.score?.sleep_needed?.need_from_recent_strain_milli,
      raw_data: s,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('whoop_sleep')
      .upsert(sleepRows, { onConflict: 'user_id,whoop_sleep_id' });
    if (error) console.error('Sleep upsert error:', error.message);
    else results.sleep = sleepRows.length;
  }

  // Process cycle records + recovery
  if (cycleRecords.length > 0) {
    const cycleRows = cycleRecords.map((c: any) => ({
      user_id: userId,
      whoop_cycle_id: String(c.id),
      start_time: c.start,
      end_time: c.end,
      timezone_offset: c.timezone_offset,
      score_state: c.score_state,
      strain: c.score?.strain,
      kilojoule: c.score?.kilojoule,
      average_heart_rate: c.score?.average_heart_rate,
      max_heart_rate: c.score?.max_heart_rate,
      raw_data: c,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('whoop_cycles')
      .upsert(cycleRows, { onConflict: 'user_id,whoop_cycle_id' });
    if (error) console.error('Cycle upsert error:', error.message);
    else results.cycles = cycleRows.length;

    // Fetch recovery for each cycle
    const recoveryRows: any[] = [];
    for (const c of cycleRecords) {
      try {
        const recovery = await whoopFetch(accessToken, `/cycle/${c.id}/recovery`);
        if (recovery) {
          recoveryRows.push({
            user_id: userId,
            whoop_cycle_id: String(recovery.cycle_id || c.id),
            whoop_sleep_id: recovery.sleep_id ? String(recovery.sleep_id) : null,
            score_state: recovery.score_state,
            recovery_score: recovery.score?.recovery_score,
            resting_heart_rate: recovery.score?.resting_heart_rate,
            hrv_rmssd_milli: recovery.score?.hrv_rmssd_milli,
            spo2_pct: recovery.score?.spo2_percentage,
            skin_temp_celsius: recovery.score?.skin_temp_celsius,
            user_calibrating: recovery.score?.user_calibrating,
            raw_data: recovery,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // Some cycles may not have recovery data
      }
    }

    if (recoveryRows.length > 0) {
      const { error: recErr } = await supabase
        .from('whoop_recovery')
        .upsert(recoveryRows, { onConflict: 'user_id,whoop_cycle_id' });
      if (recErr) console.error('Recovery upsert error:', recErr.message);
      else results.recovery = recoveryRows.length;
    }
  }

  // Process workout records
  if (workoutRecords.length > 0) {
    const workoutRows = workoutRecords.map((w: any) => ({
      user_id: userId,
      whoop_workout_id: String(w.id),
      start_time: w.start,
      end_time: w.end,
      timezone_offset: w.timezone_offset,
      sport_id: w.sport_id,
      score_state: w.score_state,
      strain: w.score?.strain,
      average_heart_rate: w.score?.average_heart_rate,
      max_heart_rate: w.score?.max_heart_rate,
      kilojoule: w.score?.kilojoule,
      distance_meter: w.score?.distance_meter,
      altitude_gain_meter: w.score?.altitude_gain_meter,
      altitude_change_meter: w.score?.altitude_change_meter,
      zone_duration_json: w.score?.zone_duration,
      raw_data: w,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('whoop_workouts')
      .upsert(workoutRows, { onConflict: 'user_id,whoop_workout_id' });
    if (error) console.error('Workout upsert error:', error.message);
    else results.workouts = workoutRows.length;
  }

  // Update last_sync_at
  await supabase
    .from('whoop_connections')
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  return results;
}
