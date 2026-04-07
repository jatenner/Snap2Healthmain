/**
 * Rate Limiter — In-memory per-user rate limiting for LLM endpoints.
 *
 * Uses a simple sliding window counter stored in a Map.
 * Suitable for single-process deployments (Vercel serverless functions
 * run in isolated processes, so this limits per-instance concurrency).
 *
 * For distributed rate limiting, replace with Upstash or Vercel KV.
 */

interface RateWindow {
  count: number;
  resetAt: number; // timestamp ms
}

// In-memory store: key = "userId:endpoint" → window
const store = new Map<string, RateWindow>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, window] of Array.from(store.entries())) {
    if (now > window.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  maxRequests: number;  // max requests per window
  windowMs: number;     // window duration in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check and consume a rate limit token.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const existing = store.get(key);

  // Window expired or doesn't exist — create fresh
  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetInSeconds: Math.ceil(config.windowMs / 1000) };
  }

  // Window still active
  if (existing.count >= config.maxRequests) {
    const resetInSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

// Pre-configured limits for each LLM endpoint
export const RATE_LIMITS = {
  analyzeMeal:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },  // 10/hour
  analyzeText:   { maxRequests: 15, windowMs: 60 * 60 * 1000 },  // 15/hour
  chat:          { maxRequests: 30, windowMs: 60 * 60 * 1000 },  // 30/hour
  insightsGen:   { maxRequests: 5,  windowMs: 60 * 60 * 1000 },  // 5/hour
  enhance:       { maxRequests: 10, windowMs: 60 * 60 * 1000 },  // 10/hour
};

/**
 * Helper: Apply rate limiting and return 429 response if exceeded.
 * Returns null if allowed, or a NextResponse if rate limited.
 */
export function rateLimitResponse(
  userId: string | undefined,
  endpoint: keyof typeof RATE_LIMITS,
): Response | null {
  if (!userId) return null; // can't rate limit without user ID

  const config = RATE_LIMITS[endpoint];
  const result = checkRateLimit(userId, endpoint, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Try again in ${result.resetInSeconds} seconds.`,
        retryAfter: result.resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.resetInSeconds),
        },
      },
    );
  }

  return null;
}
