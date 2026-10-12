/**
 * Sentry (web) error monitoring, tracing, session replay, logs and metrics.
 *
 * Importing this module for its side effect initializes Sentry. Import it
 * first in main.tsx so errors thrown during boot are captured too.
 */
import { useEffect } from 'react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
import * as Sentry from '@sentry/react';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

Sentry.init({
  // DSNs are public by design: they only allow sending events, not reading them.
  dsn: 'https://e5a15bd69cfb8d88b2c92af6d5820cf3@o4512245680177152.ingest.us.sentry.io/4512245722841089',
  environment: isLocalhost ? 'development' : 'production',
  integrations: [
    // Names transactions by route pattern (/:slug/:giftListId) instead of raw URLs.
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0,
  // Attach trace headers to our API calls so frontend and backend traces link up.
  tracePropagationTargets: ['localhost', /^https:\/\/(www\.)?mesalista\.com\.mx\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
