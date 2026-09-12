import prisma from '../lib/prisma.js';
import emailService from '../services/emailService.js';

export type PublishPlanType = 'FIXED' | 'COMMISSION';

export type PublishResult =
  | { ok: true; giftList: { id: number; title: string; coupleName: string; eventDate: Date; planType: string; publishedAt: Date } }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_PUBLISHED' };

/**
 * Publishes a draft gift list: assigns its plan, stamps `publishedAt`, and
 * settles any discount code the plan checkout attached to the draft.
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
 *   - A discount code is redeemed exactly once, inside the same transaction as
 *     the transition, and only on the plan it actually discounted. A draft that
 *     never publishes never burns its code.
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

    // A code is attached when the FIXED checkout session is created, before the
    // couple pays, and only the fixed price is ever discounted. So redeem it
    // here — an abandoned checkout then leaves the code available — but only
    // when this publish is the fixed one it was attached for. Publishing on
    // commission instead means that checkout never completed and the code
    // discounted nothing, so drop the attachment rather than burn a use: it
    // would otherwise count against the usage limit and show up in the admin
    // stats as a registry that used the code.
    // Both branches only run on the one call that won the compare-and-set above.
    if (giftList?.discountCodeId) {
      if (planType === 'FIXED') {
        await tx.discountCode.update({
          where: { id: giftList.discountCodeId },
          data: { usageCount: { increment: 1 } },
        });
      } else {
        await tx.giftList.update({
          where: { id: giftListId },
          data: { discountCodeId: null },
        });
      }
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

  // Admin heads-up. This is the only draft -> published transition in the app,
  // so one call here covers every publish: commission from the builder, fixed
  // after Stripe, and fixed after RevenueCat. It runs only on the call that won
  // the compare-and-set above, so a webhook replay cannot send it twice. The
  // method never throws, so it needs no try/catch of its own.
  await emailService.sendAdminGiftListPublishedNotification({
    userId,
    giftListId: result.id,
    giftListTitle: result.title,
    coupleName: result.coupleName,
    eventDate: result.eventDate,
    planType,
    amount,
    publishedAt: result.publishedAt as Date,
  });

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
