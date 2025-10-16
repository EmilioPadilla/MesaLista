/**
 * Utility functions for analytics tracking
 */

const SESSION_ID_KEY = 'mesa_lista_session_id';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
    return newSessionId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.error('Failed to get/set session ID:', error);
    return generateSessionId();
  }
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}
