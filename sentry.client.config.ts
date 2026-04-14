import * as Sentry from '@sentry/nextjs';

// Client DSN must be NEXT_PUBLIC_ so it's available to the browser bundle.
// Keep it distinct from the server DSN so separate Sentry projects are
// possible if we ever want to split the rate-limit budget.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 0,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
      process.env.NEXT_PUBLIC_RAILWAY_GIT_COMMIT_SHA ??
      undefined,
  });
}
