import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLogAnalyticsEvent, useUpsertAnalyticsSession } from './useAnalytics';
import { getSessionId, getUTMParameters, getReferrer, isNewSession } from '../utils/analytics';
import { useCurrentUser } from './useUser';
import type { AnalyticsEventType } from '../services/analytics.service';

/**
 * Hook to initialize analytics session with UTM parameters
 */
export const useAnalyticsSessionInit = () => {
  const location = useLocation();
  const { mutate: upsertSession } = useUpsertAnalyticsSession();
  const { data: currentUser } = useCurrentUser();
  const sessionInitialized = useRef(false);

  useEffect(() => {
    // Only initialize session once per page load
    if (sessionInitialized.current) return;
    
    const sessionId = getSessionId();
    const isNew = isNewSession();
    
    // Only send session data if it's a new session or has UTM parameters
    const utmParams = getUTMParameters(location.search);
    const hasUTM = Object.values(utmParams).some(v => v !== undefined);
    
    if (isNew || hasUTM) {
      const referrer = getReferrer();
      
      upsertSession({
        sessionId,
        userId: currentUser?.id,
        ...utmParams,
        referrer,
        landingPage: location.pathname,
      });
      
      sessionInitialized.current = true;
    }
  }, [location.pathname, location.search, currentUser?.id]);
};

/**
 * Hook to automatically track page views
 */
export const usePageViewTracking = () => {
  const location = useLocation();
  const { mutate: logEvent } = useLogAnalyticsEvent();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    const sessionId = getSessionId();

    logEvent({
      sessionId,
      eventType: 'PAGE_VIEW',
      userId: currentUser?.id,
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });
  }, [location.pathname, location.search, currentUser?.id]);
};

/**
 * Hook to track custom analytics events
 */
export const useTrackEvent = () => {
  const { mutate: logEvent } = useLogAnalyticsEvent();
  const { data: currentUser } = useCurrentUser();

  return useCallback((eventType: AnalyticsEventType, metadata?: Record<string, any>) => {
    const sessionId = getSessionId();

    logEvent({
      sessionId,
      eventType,
      userId: currentUser?.id,
      metadata,
    });
  }, [logEvent, currentUser?.id]);
};
