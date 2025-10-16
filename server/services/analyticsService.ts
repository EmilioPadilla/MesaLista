import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { AnalyticsEventType } from '@prisma/client';

interface LogEventParams {
  sessionId: string;
  eventType: AnalyticsEventType;
  userId?: number;
  metadata?: Record<string, any>;
}

interface MetricsSummary {
  visitors: number;
  signIns: number;
  registryPurchases: number;
  giftPurchases: number;
  signInRate: number;
  registryPurchaseRate: number;
  giftPurchaseRate: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

export const analyticsService = {
  /**
   * Hash user ID for privacy (SHA256)
   */
  hashUserId(userId: number): string {
    return crypto.createHash('sha256').update(userId.toString()).digest('hex');
  },

  /**
   * Log an analytics event
   */
  async logEvent({ sessionId, eventType, userId, metadata }: LogEventParams): Promise<void> {
    try {
      const userHash = userId ? this.hashUserId(userId) : null;

      await prisma.analyticsEvent.create({
        data: {
          sessionId,
          eventType,
          userHash,
          metadata: metadata || undefined,
        },
      });
    } catch (error) {
      console.error('Error logging analytics event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  },

  /**
   * Get metrics summary for a date range
   */
  async getMetricsSummary(fromDate: Date, toDate: Date): Promise<MetricsSummary> {
    try {
      // Get unique visitors (unique sessionIds with PAGE_VIEW)
      const visitorsResult = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          sessionId: true,
        },
      });
      const visitors = visitorsResult.length;

      // Get unique sign-ins (unique userHash with SIGN_IN)
      const signInsResult = await prisma.analyticsEvent.groupBy({
        by: ['userHash'],
        where: {
          eventType: 'SIGN_IN',
          userHash: { not: null },
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          userHash: true,
        },
      });
      const signIns = signInsResult.length;

      // Get registry purchases count
      const registryPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_PURCHASE',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });

      // Get gift purchases count
      const giftPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'GIFT_PURCHASE',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });

      // Calculate conversion rates
      const signInRate = visitors > 0 ? (signIns / visitors) * 100 : 0;
      const registryPurchaseRate = signIns > 0 ? (registryPurchases / signIns) * 100 : 0;
      const giftPurchaseRate = visitors > 0 ? (giftPurchases / visitors) * 100 : 0;

      return {
        visitors,
        signIns,
        registryPurchases,
        giftPurchases,
        signInRate: Math.round(signInRate * 100) / 100,
        registryPurchaseRate: Math.round(registryPurchaseRate * 100) / 100,
        giftPurchaseRate: Math.round(giftPurchaseRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting metrics summary:', error);
      throw new Error('Failed to get metrics summary');
    }
  },

  /**
   * Get time series data for a specific metric
   */
  async getTimeSeries(
    metric: 'visitors' | 'signIns' | 'registryPurchases' | 'giftPurchases',
    fromDate: Date,
    toDate: Date,
    granularity: 'daily' | 'hourly' = 'daily',
  ): Promise<TimeSeriesData[]> {
    try {
      if (granularity === 'daily') {
        // Use aggregated daily data if available
        const dailyData = await prisma.analyticsDaily.findMany({
          where: {
            date: {
              gte: fromDate,
              lte: toDate,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        return dailyData.map((day) => ({
          date: day.date.toISOString().split('T')[0],
          value: day[metric],
        }));
      } else {
        // For hourly, query raw events (more expensive)
        // This is a simplified version - you might want to optimize this
        const eventTypeMap = {
          visitors: 'PAGE_VIEW',
          signIns: 'SIGN_IN',
          registryPurchases: 'REGISTRY_PURCHASE',
          giftPurchases: 'GIFT_PURCHASE',
        };

        const events = await prisma.analyticsEvent.findMany({
          where: {
            eventType: eventTypeMap[metric] as AnalyticsEventType,
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
          select: {
            createdAt: true,
            sessionId: true,
            userHash: true,
          },
        });

        // Group by hour
        const hourlyMap = new Map<string, Set<string>>();
        events.forEach((event) => {
          const hour = new Date(event.createdAt);
          hour.setMinutes(0, 0, 0);
          const hourKey = hour.toISOString();

          if (!hourlyMap.has(hourKey)) {
            hourlyMap.set(hourKey, new Set());
          }

          // For visitors/signIns, count unique sessions/users
          if (metric === 'visitors') {
            hourlyMap.get(hourKey)!.add(event.sessionId);
          } else if (metric === 'signIns' && event.userHash) {
            hourlyMap.get(hourKey)!.add(event.userHash);
          } else {
            // For purchases, just count events
            hourlyMap.get(hourKey)!.add(event.createdAt.toISOString());
          }
        });

        return Array.from(hourlyMap.entries())
          .map(([date, set]) => ({
            date,
            value: set.size,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch (error) {
      console.error('Error getting time series:', error);
      throw new Error('Failed to get time series data');
    }
  },

  /**
   * Aggregate daily metrics (to be run as a cron job)
   */
  async aggregateDailyMetrics(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get unique visitors
      const visitorsResult = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const visitors = visitorsResult.length;

      // Get unique sign-ins
      const signInsResult = await prisma.analyticsEvent.groupBy({
        by: ['userHash'],
        where: {
          eventType: 'SIGN_IN',
          userHash: { not: null },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const signIns = signInsResult.length;

      // Get registry purchases
      const registryPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_PURCHASE',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get gift purchases
      const giftPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'GIFT_PURCHASE',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Upsert daily aggregate
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      await prisma.analyticsDaily.upsert({
        where: {
          date: dateOnly,
        },
        create: {
          date: dateOnly,
          visitors,
          signIns,
          registryPurchases,
          giftPurchases,
        },
        update: {
          visitors,
          signIns,
          registryPurchases,
          giftPurchases,
        },
      });

      console.log(`Aggregated metrics for ${dateOnly.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error aggregating daily metrics:', error);
      throw new Error('Failed to aggregate daily metrics');
    }
  },

  /**
   * Clean up old events (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Deleted ${result.count} old analytics events`);
    } catch (error) {
      console.error('Error cleaning up old events:', error);
      throw new Error('Failed to cleanup old events');
    }
  },

  /**
   * Clean up old daily aggregates (retention policy)
   */
  async cleanupOldAggregates(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.analyticsDaily.deleteMany({
        where: {
          date: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Deleted ${result.count} old daily aggregates`);
    } catch (error) {
      console.error('Error cleaning up old aggregates:', error);
      throw new Error('Failed to cleanup old aggregates');
    }
  },
};

export default analyticsService;
