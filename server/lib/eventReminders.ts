import cron from 'node-cron';
import prisma from './prisma.js';
import pushService from '../services/pushService.js';

// Days-before-event milestones at which we send a countdown reminder.
const MILESTONES = [30, 7, 1];

/**
 * Event Reminder Job
 * Runs daily and pushes a countdown reminder to couples whose event lands on one
 * of the MILESTONE days from today. Because it runs once per day and matches on the
 * event's calendar day, each list receives at most one push per milestone.
 */
class EventReminderJob {
  private task: cron.ScheduledTask | null = null;

  start() {
    // Daily at 10:00 AM (server time).
    this.task = cron.schedule('0 10 * * *', () => {
      this.run().catch((error) => console.error('❌ Error during event reminder job:', error));
    });
    console.log('🔔 Event reminder job started (daily at 10:00 AM)');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      console.log('Event reminder job stopped');
    }
  }

  /**
   * Send countdown reminders for every active gift list whose event falls on a
   * milestone day from today. Exposed for manual runs / testing.
   */
  async run(now: Date = new Date()): Promise<{ sent: number }> {
    let sent = 0;

    for (const daysUntil of MILESTONES) {
      const { start, end } = dayWindow(now, daysUntil);
      const lists = await prisma.giftList.findMany({
        where: {
          isActive: true,
          eventDate: { gte: start, lte: end },
        },
        select: { userId: true, coupleName: true },
      });

      for (const list of lists) {
        try {
          await pushService.sendEventCountdownPush({
            userId: list.userId,
            coupleName: list.coupleName,
            daysUntil,
          });
          sent++;
        } catch (error) {
          console.error(`Failed to send countdown push (T-${daysUntil}) for user ${list.userId}:`, error);
        }
      }
    }

    if (sent > 0) console.log(`✅ Event reminder job sent ${sent} countdown push(es)`);
    return { sent };
  }
}

/** Start/end of the calendar day that is `daysUntil` days after `now`. */
function dayWindow(now: Date, daysUntil: number): { start: Date; end: Date } {
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntil);
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default new EventReminderJob();
