/**
 * Sentry (server) error monitoring and tracing.
 *
 * Must load before anything else so Sentry can instrument Express, http and
 * Prisma as they're imported. The server runs as ESM, so this is preloaded with
 * `node --import` (see nixpacks.toml and the `server` npm script) rather than
 * imported from index.ts.
 */
import 'dotenv/config';
import * as Sentry from '@sentry/node';

Sentry.init({
  // DSNs are public by design: they only allow sending events, not reading them.
  dsn:
    process.env.SENTRY_DSN ||
    'https://3c118aaa3c49b2f4597eed638f8af787@o4512245680177152.ingest.us.sentry.io/4512245755478016',
  // The autofix alert only fires for `production`, so local errors never open PRs.
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  tracesSampleRate: 1.0,
  // Request/response bodies hold guest names, emails and payment details, and
  // cookies carry session ids; keep both out of Sentry.
  dataCollection: {
    httpBodies: [],
    cookies: false,
  },
});
