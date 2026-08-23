import prisma from '../lib/prisma.js';
import emailService from '../services/emailService.js';

export type PublishPlanType = 'FIXED' | 'COMMISSION';

export type PublishResult =
  | { ok: true; giftList: { id: number; title: string; coupleName: string; eventDate: Date; planType: string; publishedAt: Date } }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_PUBLISHED' };

/**
 * Publishes a draft gift list: assigns its plan, stamps `publishedAt`, and
 * redeems any discount code the couple attached at signup.
 *
 * This is the ONLY place a list moves from draft to published. Both the
 * commission path (giftListController.publishGiftList) and the fixed path
 * (paymentController, after Stripe or RevenueCat confirms payment) come through
 * here, so the invariants live in one place:
 *
 *   - The transition is atomic. `updateMany` is scoped to
 *     `{ id, userId, planType: null }`, so two concurrent publishes — or a
 *     webhook replay racing the client's own completion call — can only produce
 *     one winner. Everyone else sees ALREADY_PUBLISHED and changes nothing.
 *   - The plan is immutable afterwards. Because the guard requires
 *     `planType: null`, a published list can never be re-planned through here,
 *     which is what stops a paid FIXED list being downgraded to COMMISSION.
 *   - The discount code is redeemed exactly once, inside the same transaction as
 *     the transition. A draft that never publishes never burns its code.
 */
export async function publishGiftList({
  giftListId,
  userId,
  planType,
  amount = 0,
}: {
  giftListId: number;
  userId: number;
  planType: PublishPlanType;
  /** Charged amount, for the confirmation email only. Commission publishes are 0. */
  amount?: number;
}): Promise<PublishResult> {
  const publishedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.giftList.updateMany({
      // The `planType: null` guard makes this the atomic compare-and-set.
      where: { id: giftListId, userId, planType: null },
      data: { planType, publishedAt },
    });

    if (updated.count === 0) {
      return null;
    }

    const giftList = await tx.giftList.findUnique({
      where: { id: giftListId },
      select: {
        id: true,
        title: true,
        coupleName: true,
        eventDate: true,
        planType: true,
        publishedAt: true,
        discountCodeId: true,
      },
    });

    // Redeeming here rather than at signup means an abandoned draft leaves the
    // code available. Safe to run unconditionally: we only reach it on the one
    // call that won the compare-and-set above.
    if (giftList?.discountCodeId) {
      await tx.discountCode.update({
        where: { id: giftList.discountCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return giftList;
  });

  if (!result) {
    // Either the list is not ours, does not exist, or was already published.
    const existing = await prisma.giftList.findUnique({
      where: { id: giftListId },
      select: { userId: true, planType: true },
    });
    if (!existing || existing.userId !== userId) return { ok: false, reason: 'NOT_FOUND' };
    return { ok: false, reason: 'ALREADY_PUBLISHED' };
  }

  // Email failures must not roll back a successful publish — the couple has
  // paid and the registry is live either way.
  try {
    await emailService.sendGiftListCreationEmail({
      userId,
      giftListId: result.id,
      giftListTitle: result.title,
      coupleName: result.coupleName,
      eventDate: result.eventDate,
      planType,
      amount,
    });
  } catch (emailError) {
    console.error('Error sending gift list publish email:', emailError);
  }

  return {
    ok: true,
    giftList: {
      id: result.id,
      title: result.title,
      coupleName: result.coupleName,
      eventDate: result.eventDate,
      planType: result.planType as string,
      publishedAt: result.publishedAt as Date,
    },
  };
}
