import prisma from '../lib/prisma.js';

/**
 * Admin event calendar: every gift list's event date, the money it has
 * collected, and which date-driven follow-ups an admin already logged.
 *
 * The schedule (what is due how many days around the event) lives client side in
 * packages/shared/src/config/eventActions.ts. The server only needs the valid
 * keys and which of them send an email — keep these in sync with that file.
 */
export const EVENT_ACTION_KEYS = ['bank_info_request', 'bank_info_received', 'payout_sent'] as const;
export type EventActionKey = (typeof EVENT_ACTION_KEYS)[number];

/** Actions the calendar can send directly, mapped to the marketing email they send. */
export const EMAIL_EVENT_ACTIONS: Partial<Record<EventActionKey, 'bank_info_request'>> = {
  bank_info_request: 'bank_info_request',
};

export const isEventActionKey = (value: unknown): value is EventActionKey =>
  typeof value === 'string' && (EVENT_ACTION_KEYS as readonly string[]).includes(value);

export interface CalendarEventAction {
  action: string;
  status: 'DONE' | 'SKIPPED';
  note: string | null;
  completedAt: string;
  completedBy: string | null;
}

export interface CalendarEvent {
  giftListId: number;
  title: string;
  coupleName: string;
  eventDate: string;
  eventLocation: string | null;
  eventVenue: string | null;
  planType: 'FIXED' | 'COMMISSION' | null;
  publishedAt: string | null;
  isActive: boolean;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    slug: string | null;
  };
  grossCollected: number;
  paidPaymentsCount: number;
  actions: CalendarEventAction[];
}

const eventCalendarService = {
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const lists = await prisma.giftList.findMany({
      select: {
        id: true,
        title: true,
        coupleName: true,
        eventDate: true,
        eventLocation: true,
        eventVenue: true,
        planType: true,
        publishedAt: true,
        isActive: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, slug: true },
        },
        eventActions: {
          select: {
            action: true,
            status: true,
            note: true,
            completedAt: true,
            completedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    // Same bucketing as paymentAnalyticsService: attribute a paid cart to a list via
    // its items' gift.giftListId, because cart.giftListId can be NULL on orphaned carts.
    const paidCarts = await prisma.cart.findMany({
      where: { status: 'PAID', payment: { status: 'PAID' } },
      select: {
        payment: { select: { amount: true } },
        items: { select: { gift: { select: { giftListId: true } } } },
      },
    });

    const collectedByList = new Map<number, { gross: number; count: number }>();
    for (const cart of paidCarts) {
      if (!cart.payment) continue;
      const listId = cart.items.find((item) => item.gift?.giftListId)?.gift?.giftListId;
      if (!listId) continue;
      const bucket = collectedByList.get(listId) ?? { gross: 0, count: 0 };
      bucket.gross += cart.payment.amount;
      bucket.count += 1;
      collectedByList.set(listId, bucket);
    }

    return lists.map((list) => {
      const collected = collectedByList.get(list.id) ?? { gross: 0, count: 0 };
      return {
        giftListId: list.id,
        title: list.title,
        coupleName: list.coupleName,
        eventDate: list.eventDate.toISOString(),
        eventLocation: list.eventLocation,
        eventVenue: list.eventVenue,
        planType: list.planType,
        publishedAt: list.publishedAt?.toISOString() ?? null,
        isActive: list.isActive,
        user: list.user,
        grossCollected: collected.gross,
        paidPaymentsCount: collected.count,
        actions: list.eventActions.map((logged) => ({
          action: logged.action,
          status: logged.status,
          note: logged.note,
          completedAt: logged.completedAt.toISOString(),
          completedBy: logged.completedBy ? `${logged.completedBy.firstName} ${logged.completedBy.lastName}`.trim() : null,
        })),
      };
    });
  },

  async getGiftListOwner(giftListId: number): Promise<{ userId: number } | null> {
    return prisma.giftList.findUnique({ where: { id: giftListId }, select: { userId: true } });
  },

  async logAction(params: {
    giftListId: number;
    action: EventActionKey;
    status: 'DONE' | 'SKIPPED';
    note?: string | null;
    adminUserId?: number | null;
  }) {
    const { giftListId, action, status, note = null, adminUserId = null } = params;
    const data = { status, note, completedAt: new Date(), completedById: adminUserId };
    return prisma.eventAction.upsert({
      where: { giftListId_action: { giftListId, action } },
      create: { giftListId, action, ...data },
      update: data,
    });
  },

  async clearAction(giftListId: number, action: EventActionKey): Promise<void> {
    await prisma.eventAction.deleteMany({ where: { giftListId, action } });
  },

  /**
   * Record a calendar email that went out through another admin flow (Control or
   * Marketing "send to selected"), so the calendar doesn't show it as pending and
   * nobody sends it twice. Marks the user's upcoming published lists that don't
   * have the action logged yet.
   */
  async recordEmailSentOutsideCalendar(userId: number, emailType: string): Promise<void> {
    const action = (Object.keys(EMAIL_EVENT_ACTIONS) as EventActionKey[]).find((key) => EMAIL_EVENT_ACTIONS[key] === emailType);
    if (!action) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const lists = await prisma.giftList.findMany({
      where: {
        userId,
        publishedAt: { not: null },
        eventDate: { gte: startOfToday },
        eventActions: { none: { action } },
      },
      select: { id: true },
    });

    for (const list of lists) {
      await this.logAction({
        giftListId: list.id,
        action,
        status: 'DONE',
        note: 'Enviado desde otra sección del admin',
      });
    }
  },
};

export default eventCalendarService;
