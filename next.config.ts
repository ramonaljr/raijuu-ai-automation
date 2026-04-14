import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

// Only wrap with Sentry when a DSN is configured. Keeps local builds free of
// any Sentry-owned rewrites (tunnel route, source-map munging) for devs who
// haven't opted into Sentry. Source-map upload then layers on automatically
// when SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT are all set.
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      reactComponentAnnotation: { enabled: true },
      // Browser-side events go to /monitoring and we proxy to Sentry, which
      // bypasses ad-blockers that would otherwise drop telemetry.
      tunnelRoute: '/monitoring',
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
