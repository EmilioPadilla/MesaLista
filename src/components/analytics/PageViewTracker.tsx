import { usePageViewTracking } from '../../hooks/useAnalyticsTracking';

/**
 * Component that tracks page views automatically
 * Place this inside BrowserRouter but outside Routes
 */
export function PageViewTracker() {
  usePageViewTracking();
  return null;
}
