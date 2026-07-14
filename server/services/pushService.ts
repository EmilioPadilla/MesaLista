import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';
import emailService from './emailService.js';

const prisma = new PrismaClient();

// Configure Expo push client. An access token is recommended (enhanced security /
// error reporting) but not required for sending. Mirrors emailService's guard on a
// missing Postmark key: if push isn't configured we warn and no-op instead of throwing.
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN || undefined;
const expo = new Expo({ accessToken: EXPO_ACCESS_TOKEN });

const currency = (amount: number, code: string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: code || 'MXN' }).format(amount);

class PushService {
  /**
   * Send a gift-received push to the couple who owns the gift list for a paid cart.
   * Reuses emailService.getPaymentEmailData so the push and email share one query.
   * Fire-and-forget safe: never throws for "no tokens" — that's the common case.
   */
  async sendGiftReceivedPush(cartId: number): Promise<void> {
    const data = await emailService.getPaymentEmailData(cartId);
    const ownerUserId = data.coupleInfo.userId;

    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const firstItem = data.items[0]?.giftTitle ?? 'un regalo';
    const body =
      itemsCount > 1
        ? `${data.guestName} te regaló ${itemsCount} regalos (${currency(totalAmount, data.currency)})`
        : `${data.guestName} te regaló ${firstItem}`;

    await this.sendToUser(ownerUserId, {
      title: '¡Nuevo regalo! 🎁',
      body,
      data: { type: 'gift_received', cartId },
    });
  }

  /**
   * Send an RSVP-received push to the couple who owns the gift list.
   * Only meaningful responses (CONFIRMED / REJECTED) push; PENDING is skipped.
   * Fire-and-forget safe.
   */
  async sendRsvpReceivedPush(params: {
    giftListId: number;
    inviteeName: string;
    status: string;
    confirmedTickets?: number | null;
  }): Promise<void> {
    if (params.status !== 'CONFIRMED' && params.status !== 'REJECTED') return;

    const giftList = await prisma.giftList.findUnique({
      where: { id: params.giftListId },
      select: { userId: true },
    });
    if (!giftList) return;

    const name = params.inviteeName.trim() || 'Un invitado';
    const tickets = params.confirmedTickets ?? 0;
    const content =
      params.status === 'CONFIRMED'
        ? {
            title: '¡Confirmación de asistencia! 🎉',
            body: tickets > 1 ? `${name} asistirá con ${tickets} boletos` : `${name} confirmó su asistencia`,
          }
        : {
            title: 'Respuesta de invitación',
            body: `${name} no podrá asistir`,
          };

    await this.sendToUser(giftList.userId, {
      ...content,
      data: { type: 'rsvp_received', giftListId: params.giftListId },
    });
  }

  /**
   * Send an event-countdown reminder to a couple N days before their event.
   * Called by the daily eventReminders cron job. Fire-and-forget safe.
   */
  async sendEventCountdownPush(params: { userId: number; coupleName: string; daysUntil: number }): Promise<void> {
    const { userId, coupleName, daysUntil } = params;
    const content =
      daysUntil <= 1
        ? { title: '¡Mañana es el gran día! 💫', body: `El evento de ${coupleName} es mañana` }
        : { title: 'Tu evento se acerca ✨', body: `Faltan ${daysUntil} días para el evento de ${coupleName}` };

    await this.sendToUser(userId, {
      ...content,
      data: { type: 'event_countdown', daysUntil },
    });
  }

  /**
   * Look up a user's device tokens and deliver one notification to each.
   * Central path for all push types: no tokens is the common, silent case.
   */
  private async sendToUser(
    userId: number,
    content: { title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title: content.title,
        body: content.body,
        data: content.data,
      }));
    if (messages.length === 0) return;

    await this.send(messages);
    console.log(`Push "${content.title}" sent to user ${userId} (${messages.length} device(s)).`);
  }

  /**
   * Send a batch of messages via the Expo push service, chunked per Expo's limits.
   * Prunes tokens the Expo ticket reports as unregistered so we stop pushing to dead devices.
   */
  private async send(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...receipts);
      } catch (error) {
        console.error('Error sending Expo push chunk:', error);
      }
    }

    // Prune tokens Expo rejected as unregistered (uninstalled app / stale token).
    const staleTokens: string[] = [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        const to = messages[i]?.to;
        if (typeof to === 'string') staleTokens.push(to);
      }
    });

    if (staleTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: staleTokens } } });
      console.log(`Pruned ${staleTokens.length} unregistered push token(s).`);
    }
  }
}

export default new PushService();
