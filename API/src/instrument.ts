/**
 * Sentry (P3.2) — loaded before Nest bootstrap when SENTRY_DSN is set.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as typeof import('@sentry/node');
    Sentry.init({
      dsn,
      environment:
        process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      tracesSampleRate: Number.parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
      ),
    });
  } catch {
    console.warn('[Sentry] @sentry/node not installed — skip observability');
  }
}
