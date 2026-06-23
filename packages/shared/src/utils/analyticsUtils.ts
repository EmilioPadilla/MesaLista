/**
 * Utility functions for analytics tracking
 */

const SESSION_ID_KEY = 'mesa_lista_session_id';
const SESSION_START_KEY = 'mesa_lista_session_start';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export interface UTMParameters {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract UTM parameters from URL
 */
export function getUTMParameters(search: string = window.location.search): UTMParameters {
  const params = new URLSearchParams(search);
  
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    utmContent: params.get('utm_content') || undefined,
  };
}

/**
 * Get referrer (excluding same-origin)
 */
export function getReferrer(): string | undefined {
  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    return document.referrer;
  }
  return undefined;
}

/**
 * Get or create a session ID
 * Session expires after 30 minutes of inactivity
 */
export function getSessionId(): string {
  try {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    
    if (stored) {
      const { sessionId, timestamp } = JSON.parse(stored);
      const now = Date.now();
      
      // Check if session is still valid
      if (now - timestamp < SESSION_DURATION) {
        // Update timestamp to extend session
        localStorage.setItem(SESSION_ID_KEY, JSON.stringify({ sessionId, timestamp: now }));
        return sessionId;
      }
    }
    
    // Create new session
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, JSON.stringify({ sessionId: newSessionId, timestamp: Date.now() }));
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    return newSessionId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.error('Failed to get/set session ID:', error);
    return generateSessionId();
  }
}

/**
 * Check if this is a new session
 */
export function isNewSession(): boolean {
  try {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    return !stored;
  } catch (error) {
    return true;
  }
}

/**
 * Get session start time
 */
export function getSessionStartTime(): number | null {
  try {
    const startTime = localStorage.getItem(SESSION_START_KEY);
    return startTime ? parseInt(startTime, 10) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate session duration in milliseconds
 */
export function getSessionDuration(): number {
  const startTime = getSessionStartTime();
  if (!startTime) return 0;
  return Date.now() - startTime;
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_START_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}
