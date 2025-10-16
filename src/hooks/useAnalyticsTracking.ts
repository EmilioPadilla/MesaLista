import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLogAnalyticsEvent } from './useAnalytics';
import { getSessionId } from '../utils/analytics';
import { useCurrentUser } from './useUser';
import type { AnalyticsEventType } from '../services/analytics.service';

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

  return (eventType: AnalyticsEventType, metadata?: Record<string, any>) => {
    const sessionId = getSessionId();

    logEvent({
      sessionId,
      eventType,
      userId: currentUser?.id,
      metadata,
    });
  };
};
