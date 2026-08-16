import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { analyticsService, type AnalyticsEventType } from 'services/analytics.service';

const SESSION_KEY = 'mesalista.analytics_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // matches the web session window

const isWeb = Platform.OS === 'web';

/**
 * First-party analytics for the mobile app, feeding the same
 * `analytics_events` / `analytics_sessions` tables the web app writes to (see
 * packages/shared/src/hooks/useAnalyticsTracking.ts).
 *
 * The web hooks can't be reused: they depend on react-router's `useLocation`,
 * `window.location` and `localStorage`. Here the session id lives in
 * expo-secure-store (async, so everything below is fire-and-forget) and screen
 * paths are passed explicitly.
 *
 * Mobile sessions are upserted with `utmSource: 'mobile_app'`, which is what
 * makes them separable from web traffic in the admin funnel breakdown.
 */

const MOBILE_UTM_SOURCE = 'mobile_app';

type StoredSession = { sessionId: string; timestamp: number };

// Avoids hitting SecureStore on every event; the store is still written through
// so a session survives an app restart inside the 30 minute window.
let cachedSession: StoredSession | null = null;

const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

async function readStored(): Promise<StoredSession | null> {
  try {
    const raw = isWeb
      ? typeof localStorage !== 'undefined'
        ? localStorage.getItem(SESSION_KEY)
        : null
      : await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

async function writeStored(session: StoredSession): Promise<void> {
  try {
    const raw = JSON.stringify(session);
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, raw);
  } catch {
    // Analytics must never break the app.
  }
}

/**
 * Serializes session resolution: the store read is async, so two events fired
 * before the cache is warm would otherwise mint two session ids.
 */
let sessionQueue: Promise<unknown> = Promise.resolve();

function getSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const next = sessionQueue.then(resolveSession, resolveSession);
  sessionQueue = next.catch(() => undefined);
  return next;
}

/**
 * Current session id, rotated after 30 minutes of inactivity. `isNew` reports
 * whether this call started a session (used to upsert it server-side once).
 */
async function resolveSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const now = Date.now();
  const stored = cachedSession ?? (await readStored());

  if (stored && now - stored.timestamp < SESSION_TTL_MS) {
    const touched = { sessionId: stored.sessionId, timestamp: now };
    cachedSession = touched;
    void writeStored(touched);
    return { sessionId: touched.sessionId, isNew: false };
  }

  const fresh = { sessionId: generateSessionId(), timestamp: now };
  cachedSession = fresh;
  void writeStored(fresh);
  return { sessionId: fresh.sessionId, isNew: true };
}

/** Stamped onto every event so mobile can be segmented against web traffic. */
const baseMetadata = () => ({
  platform: Platform.OS,
  client: 'mobile_app',
  appVersion: Constants.expoConfig?.version,
});

/**
 * Log an analytics event. Never throws and never blocks the caller — the
 * service already swallows network errors.
 */
export function trackEvent(eventType: AnalyticsEventType, metadata?: Record<string, unknown>, userId?: number): void {
  void (async () => {
    try {
      const { sessionId, isNew } = await getSession();
      if (isNew) await upsertSession(sessionId, userId);
      await analyticsService.logEvent({
        sessionId,
        eventType,
        userId,
        metadata: { ...baseMetadata(), ...metadata },
      });
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  })();
}

async function upsertSession(sessionId: string, userId?: number): Promise<void> {
  await analyticsService.upsertSession({
    sessionId,
    userId,
    utmSource: MOBILE_UTM_SOURCE,
    utmMedium: Platform.OS,
    landingPage: '/app',
    userAgent: `MesaListaApp/${Constants.expoConfig?.version ?? 'unknown'} (${Platform.OS})`,
  });
}

/**
 * Screen-view equivalent of the web's PAGE_VIEW tracking. `visitors` (and every
 * conversion rate derived from it) counts unique sessions with a PAGE_VIEW, so
 * screens on the signup/login funnel must report one for mobile signups and
 * sign-ins to have a denominator.
 */
export function useScreenView(path: string, metadata?: Record<string, unknown>): void {
  useEffect(() => {
    trackEvent('PAGE_VIEW', { path, ...metadata });
    // Screens here are mounted once per visit; metadata is intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}
