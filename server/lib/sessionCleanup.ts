import { SessionService } from './sessionService.js';

/**
 * Session cleanup job to remove expired sessions
 * This should be run periodically (e.g., every hour or daily)
 */
export class SessionCleanupJob {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Start the automatic session cleanup job
   */
  static start(): void {
    if (this.intervalId) {
      console.log('Session cleanup job is already running');
      return;
    }

    console.log('Starting session cleanup job...');
    
    // Run cleanup immediately
    this.runCleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);

    console.log(`Session cleanup job started. Will run every ${this.CLEANUP_INTERVAL_MS / 1000 / 60} minutes.`);
  }

  /**
   * Stop the automatic session cleanup job
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Session cleanup job stopped');
    }
  }

  /**
   * Run a single cleanup operation
   */
  static async runCleanup(): Promise<void> {
    try {
      const deletedCount = await SessionService.cleanupExpiredSessions();
      if (deletedCount > 0) {
        console.log(`Session cleanup: Removed ${deletedCount} expired sessions`);
      }
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  /**
   * Manual cleanup trigger (useful for testing or manual maintenance)
   */
  static async manualCleanup(): Promise<number> {
    console.log('Running manual session cleanup...');
    try {
      const deletedCount = await SessionService.cleanupExpiredSessions();
      console.log(`Manual cleanup completed: Removed ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      console.error('Error during manual session cleanup:', error);
      throw error;
    }
  }
}

export default SessionCleanupJob;
