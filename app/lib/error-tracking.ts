/**
 * Structured Error Tracking
 *
 * Provides consistent error capture across API routes.
 * In production, this can be pointed at Sentry, LogRocket, or any service.
 * Currently outputs structured JSON to server logs.
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorContext {
  route: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Track an error with structured context.
 */
export function trackError(
  error: unknown,
  severity: ErrorSeverity,
  context: ErrorContext,
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  const structured = {
    timestamp: new Date().toISOString(),
    severity,
    route: context.route,
    userId: context.userId || 'anonymous',
    action: context.action || 'unknown',
    error: {
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    metadata: context.metadata,
  };

  // Output structured log (captured by Vercel/hosting provider)
  if (severity === 'critical' || severity === 'high') {
    console.error('[ERROR]', JSON.stringify(structured));
  } else {
    console.warn('[WARN]', JSON.stringify(structured));
  }

  // TODO: In production, send to Sentry/LogRocket:
  // Sentry.captureException(err, { tags: { route: context.route }, extra: context.metadata });
}

/**
 * Track a rate limit hit.
 */
export function trackRateLimit(userId: string, endpoint: string): void {
  console.warn('[RATE_LIMIT]', JSON.stringify({
    timestamp: new Date().toISOString(),
    userId,
    endpoint,
  }));
}

/**
 * Track an LLM call for cost monitoring.
 */
export function trackLLMCall(
  model: string,
  route: string,
  userId?: string,
  durationMs?: number,
): void {
  console.log('[LLM_CALL]', JSON.stringify({
    timestamp: new Date().toISOString(),
    model,
    route,
    userId: userId || 'anonymous',
    durationMs,
  }));
}
