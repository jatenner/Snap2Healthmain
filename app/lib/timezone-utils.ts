/**
 * Timezone Utilities
 *
 * Resolves the user's local timezone from the x-timezone request header.
 * Falls back to UTC if not provided or invalid.
 *
 * Frontend sends: Intl.DateTimeFormat().resolvedOptions().timeZone
 * (e.g., "America/New_York", "America/Los_Angeles", "Europe/London")
 */

/**
 * Extract and validate timezone from request headers.
 */
export function getUserTimezone(headers: { get: (name: string) => string | null }): string {
  const tz = headers.get('x-timezone');
  if (!tz) return 'UTC';
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/**
 * Get today's date (YYYY-MM-DD) in the user's local timezone.
 * This is the key function — it determines which "day" a query should target.
 */
export function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Get the current hour (0-23) in the user's timezone.
 * Used for meal tagging (breakfast/lunch/dinner) and timing logic.
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const hourStr = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(hourStr, 10);
}
