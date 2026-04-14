import * as Sentry from '@sentry/nextjs';

// Env-gated so local dev and CI don't require a DSN. When SENTRY_DSN is
// unset, Sentry never initializes and every capture call becomes a no-op.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Railway provides RAILWAY_GIT_COMMIT_SHA; Vercel provides VERCEL_GIT_COMMIT_SHA.
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.RAILWAY_GIT_COMMIT_SHA ??
      undefined,
  });
}
