// Runs once on every client page load. Env-gated inside the imported config,
// so the import is cheap when NEXT_PUBLIC_SENTRY_DSN is unset (just the
// @sentry/nextjs module evaluation — no network, no session).
import './sentry.client.config';
