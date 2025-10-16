import cron from 'node-cron';
import analyticsService from '../services/analyticsService.js';

/**
 * Analytics Aggregation Job
 * Runs daily at 2 AM to aggregate the previous day's metrics
 * Also cleans up old data based on retention policies
 */
class AnalyticsAggregationJob {
  private dailyAggregationTask: cron.ScheduledTask | null = null;
  private weeklyCleanupTask: cron.ScheduledTask | null = null;

  /**
   * Start the analytics aggregation jobs
   */
  start() {
    // Daily aggregation at 2 AM
    this.dailyAggregationTask = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily analytics aggregation...');
      try {
        // Aggregate yesterday's data
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        await analyticsService.aggregateDailyMetrics(yesterday);
        console.log('✅ Daily analytics aggregation completed');
      } catch (error) {
        console.error('❌ Error during daily analytics aggregation:', error);
      }
    });

    // Weekly cleanup on Sundays at 3 AM
    this.weeklyCleanupTask = cron.schedule('0 3 * * 0', async () => {
      console.log('Running weekly analytics cleanup...');
      try {
        // Clean up events older than 90 days
        await analyticsService.cleanupOldEvents(90);
        
        // Clean up daily aggregates older than 365 days
        await analyticsService.cleanupOldAggregates(365);
        
        console.log('✅ Weekly analytics cleanup completed');
      } catch (error) {
        console.error('❌ Error during weekly analytics cleanup:', error);
      }
    });

    console.log('📊 Analytics aggregation jobs started');
    console.log('  - Daily aggregation: Every day at 2:00 AM');
    console.log('  - Weekly cleanup: Every Sunday at 3:00 AM');
  }

  /**
   * Stop the analytics aggregation jobs
   */
  stop() {
    if (this.dailyAggregationTask) {
      this.dailyAggregationTask.stop();
      console.log('Daily analytics aggregation job stopped');
    }
    
    if (this.weeklyCleanupTask) {
      this.weeklyCleanupTask.stop();
      console.log('Weekly analytics cleanup job stopped');
    }
  }

  /**
   * Run aggregation manually (useful for testing or backfilling)
   */
  async runManualAggregation(date?: Date) {
    const targetDate = date || new Date();
    console.log(`Running manual aggregation for ${targetDate.toISOString().split('T')[0]}...`);
    
    try {
      await analyticsService.aggregateDailyMetrics(targetDate);
      console.log('✅ Manual aggregation completed');
    } catch (error) {
      console.error('❌ Error during manual aggregation:', error);
      throw error;
    }
  }

  /**
   * Run cleanup manually
   */
  async runManualCleanup(eventsRetentionDays = 90, aggregatesRetentionDays = 365) {
    console.log('Running manual cleanup...');
    
    try {
      await analyticsService.cleanupOldEvents(eventsRetentionDays);
      await analyticsService.cleanupOldAggregates(aggregatesRetentionDays);
      console.log('✅ Manual cleanup completed');
    } catch (error) {
      console.error('❌ Error during manual cleanup:', error);
      throw error;
    }
  }
}

export default new AnalyticsAggregationJob();
