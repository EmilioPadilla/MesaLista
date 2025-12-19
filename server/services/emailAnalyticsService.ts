import { PrismaClient, EmailEventType } from '@prisma/client';

const prisma = new PrismaClient();

export interface PostmarkWebhookEvent {
  RecordType: 'Delivery' | 'Bounce' | 'SpamComplaint' | 'Open' | 'Click';
  MessageID: string;
  Recipient: string;
  Subject?: string;
  Tag?: string;
  DeliveredAt?: string;
  BouncedAt?: string;
  ReceivedAt?: string;
  FirstOpen?: boolean;
  ClickedAt?: string;
  Metadata?: any;
  [key: string]: any;
}

export interface EmailAnalyticsSummary {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  spamComplaints: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailAnalyticsTimeSeries {
  date: string;
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
}

class EmailAnalyticsService {
  /**
   * Process Postmark webhook event
   */
  async processWebhookEvent(event: PostmarkWebhookEvent): Promise<void> {
    try {
      // Map Postmark event type to our enum
      const eventTypeMap: Record<string, EmailEventType> = {
        Delivery: 'DELIVERY',
        Bounce: 'BOUNCE',
        SpamComplaint: 'SPAM_COMPLAINT',
        Open: 'OPEN',
        Click: 'LINK_CLICK',
      };

      const eventType = eventTypeMap[event.RecordType];
      if (!eventType) {
        console.warn(`Unknown Postmark event type: ${event.RecordType}`);
        return;
      }

      // Determine the recorded timestamp based on event type
      let recordedAt: Date;
      if (event.DeliveredAt) {
        recordedAt = new Date(event.DeliveredAt);
      } else if (event.BouncedAt) {
        recordedAt = new Date(event.BouncedAt);
      } else if (event.ReceivedAt) {
        recordedAt = new Date(event.ReceivedAt);
      } else if (event.ClickedAt) {
        recordedAt = new Date(event.ClickedAt);
      } else {
        recordedAt = new Date();
      }

      // For Open events, only record first opens
      if (eventType === 'OPEN' && !event.FirstOpen) {
        console.log(`Skipping non-first open for message: ${event.MessageID}`);
        return;
      }

      // Store the event
      await prisma.emailAnalytics.upsert({
        where: { messageId: event.MessageID },
        update: {
          eventType,
          metadata: event.Metadata || event,
          recordedAt,
        },
        create: {
          messageId: event.MessageID,
          recipient: event.Recipient,
          subject: event.Subject,
          eventType,
          tag: event.Tag,
          metadata: event.Metadata || event,
          recordedAt,
        },
      });

      console.log(`Processed ${eventType} event for message: ${event.MessageID}`);
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Get email analytics summary for a date range
   */
  async getAnalyticsSummary(from: string, to: string): Promise<EmailAnalyticsSummary> {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Get all events in the date range
      const events = await prisma.emailAnalytics.findMany({
        where: {
          recordedAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          eventType: true,
          messageId: true,
        },
      });

      // Count unique message IDs per event type
      const deliveries = new Set(events.filter((e) => e.eventType === 'DELIVERY').map((e) => e.messageId));
      const bounces = new Set(events.filter((e) => e.eventType === 'BOUNCE').map((e) => e.messageId));
      const opens = new Set(events.filter((e) => e.eventType === 'OPEN').map((e) => e.messageId));
      const clicks = new Set(events.filter((e) => e.eventType === 'LINK_CLICK').map((e) => e.messageId));
      const spamComplaints = new Set(events.filter((e) => e.eventType === 'SPAM_COMPLAINT').map((e) => e.messageId));

      const delivered = deliveries.size;
      const bounced = bounces.size;
      const opened = opens.size;
      const clicked = clicks.size;
      const spam = spamComplaints.size;
      const sent = delivered + bounced;

      // Calculate rates
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
      const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

      return {
        sent,
        delivered,
        bounced,
        opened,
        clicked,
        spamComplaints: spam,
        deliveryRate,
        openRate,
        clickRate,
        bounceRate,
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw error;
    }
  }

  /**
   * Get email analytics time series data
   */
  async getTimeSeries(from: string, to: string): Promise<EmailAnalyticsTimeSeries[]> {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Get daily aggregates
      const dailyData = await prisma.emailAnalyticsDaily.findMany({
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
        sent: day.sent,
        delivered: day.delivered,
        bounced: day.bounced,
        opened: day.opened,
        clicked: day.clicked,
        deliveryRate: day.deliveryRate,
        openRate: day.openRate,
      }));
    } catch (error) {
      console.error('Error getting time series data:', error);
      throw error;
    }
  }

  /**
   * Get email analytics by tag
   */
  async getAnalyticsByTag(from: string, to: string): Promise<Array<{ tag: string; count: number; eventType: EmailEventType }>> {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      const events = await prisma.emailAnalytics.groupBy({
        by: ['tag', 'eventType'],
        where: {
          recordedAt: {
            gte: fromDate,
            lte: toDate,
          },
          tag: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
      });

      return events.map((event) => ({
        tag: event.tag || 'unknown',
        eventType: event.eventType,
        count: event._count.id,
      }));
    } catch (error) {
      console.error('Error getting analytics by tag:', error);
      throw error;
    }
  }

  /**
   * Aggregate daily email analytics
   * Should be run daily via cron job
   */
  async aggregateDailyMetrics(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all events for the day
      const events = await prisma.emailAnalytics.findMany({
        where: {
          recordedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          eventType: true,
          messageId: true,
        },
      });

      // Count unique message IDs per event type
      const deliveries = new Set(events.filter((e) => e.eventType === 'DELIVERY').map((e) => e.messageId));
      const bounces = new Set(events.filter((e) => e.eventType === 'BOUNCE').map((e) => e.messageId));
      const opens = new Set(events.filter((e) => e.eventType === 'OPEN').map((e) => e.messageId));
      const clicks = new Set(events.filter((e) => e.eventType === 'LINK_CLICK').map((e) => e.messageId));
      const spamComplaints = new Set(events.filter((e) => e.eventType === 'SPAM_COMPLAINT').map((e) => e.messageId));

      const delivered = deliveries.size;
      const bounced = bounces.size;
      const opened = opens.size;
      const clicked = clicks.size;
      const spam = spamComplaints.size;
      const sent = delivered + bounced;

      // Calculate rates
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;

      // Upsert daily aggregate
      await prisma.emailAnalyticsDaily.upsert({
        where: { date: startOfDay },
        update: {
          sent,
          delivered,
          bounced,
          opened,
          clicked,
          spamComplaints: spam,
          deliveryRate,
          openRate,
          clickRate,
        },
        create: {
          date: startOfDay,
          sent,
          delivered,
          bounced,
          opened,
          clicked,
          spamComplaints: spam,
          deliveryRate,
          openRate,
          clickRate,
        },
      });

      console.log(`Aggregated email analytics for ${startOfDay.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error aggregating daily metrics:', error);
      throw error;
    }
  }

  /**
   * Get recent bounces and spam complaints for monitoring
   */
  async getRecentIssues(hours: number = 24): Promise<{ bounces: any[]; spamComplaints: any[] }> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const bounces = await prisma.emailAnalytics.findMany({
        where: {
          eventType: 'BOUNCE',
          recordedAt: {
            gte: since,
          },
        },
        orderBy: {
          recordedAt: 'desc',
        },
        take: 50,
      });

      const spamComplaints = await prisma.emailAnalytics.findMany({
        where: {
          eventType: 'SPAM_COMPLAINT',
          recordedAt: {
            gte: since,
          },
        },
        orderBy: {
          recordedAt: 'desc',
        },
        take: 50,
      });

      return { bounces, spamComplaints };
    } catch (error) {
      console.error('Error getting recent issues:', error);
      throw error;
    }
  }
}

export default new EmailAnalyticsService();
