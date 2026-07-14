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

    const tokens = await prisma.pushToken.findMany({
      where: { userId: ownerUserId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      console.log(`No push tokens registered for user ${ownerUserId}; skipping gift-received push.`);
      return;
    }

    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const firstItem = data.items[0]?.giftTitle ?? 'un regalo';
    const body =
      itemsCount > 1
        ? `${data.guestName} te regaló ${itemsCount} regalos (${currency(totalAmount, data.currency)})`
        : `${data.guestName} te regaló ${firstItem}`;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: '¡Nuevo regalo! 🎁',
        body,
        sound: 'default',
        data: { type: 'gift_received', cartId },
      }));

    if (messages.length === 0) {
      console.warn(`No valid Expo push tokens for user ${ownerUserId}; skipping.`);
      return;
    }

    await this.send(messages);
    console.log(`Gift-received push sent to user ${ownerUserId} (${messages.length} device(s)).`);
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
