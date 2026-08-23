import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S2 / TEST-S4 / TEST-S9 — the publish service is the ONLY place a list
// moves from draft to published, so its invariants are asserted here: the
// transition is atomic and single-shot, the plan is immutable afterwards, and a
// discount code is redeemed exactly once.

const giftListUpdateMany = vi.fn();
const giftListFindUnique = vi.fn();
const discountCodeUpdate = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  default: {
    giftList: { updateMany: giftListUpdateMany, findUnique: giftListFindUnique },
    discountCode: { update: discountCodeUpdate },
    $transaction: async (cb: (tx: any) => Promise<any>) =>
      cb({
        giftList: { updateMany: giftListUpdateMany, findUnique: giftListFindUnique },
        discountCode: { update: discountCodeUpdate },
      }),
  },
}));

vi.mock('./emailService.js', () => ({
  default: { sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined) },
}));

const { publishGiftList } = await import('./giftListPublishService.js');
const { default: emailService } = await import('./emailService.js');

const draft = {
  id: 10,
  title: 'Mesa de Regalos de Maria y Juan',
  coupleName: 'Maria y Juan',
  eventDate: new Date('2026-12-01'),
  planType: 'COMMISSION',
  publishedAt: new Date('2026-08-16'),
  discountCodeId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  giftListUpdateMany.mockResolvedValue({ count: 1 });
  giftListFindUnique.mockResolvedValue(draft);
});

describe('publishGiftList', () => {
  it('sets the plan and publishedAt, guarded on the list still being a draft', async () => {
    const result = await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(result.ok).toBe(true);
    const call = giftListUpdateMany.mock.calls[0][0];
    // The `planType: null` guard is what makes this an atomic compare-and-set:
    // two concurrent publishes can't both win.
    expect(call.where).toEqual({ id: 10, userId: 1, planType: null });
    expect(call.data.planType).toBe('COMMISSION');
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it('reports ALREADY_PUBLISHED and changes nothing when the list is live', async () => {
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindUnique.mockResolvedValue({ userId: 1, planType: 'FIXED' });

    const result = await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(result).toEqual({ ok: false, reason: 'ALREADY_PUBLISHED' });
    expect(discountCodeUpdate).not.toHaveBeenCalled();
    expect(emailService.sendGiftListCreationEmail).not.toHaveBeenCalled();
  });

  it('refuses to publish a list owned by someone else', async () => {
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindUnique.mockResolvedValue({ userId: 999, planType: null });

    const result = await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('cannot downgrade a paid FIXED list to COMMISSION', async () => {
    // The compare-and-set requires planType: null, so a published FIXED list
    // never matches and the plan can't be rewritten.
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindUnique.mockResolvedValue({ userId: 1, planType: 'FIXED' });

    const result = await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(result.ok).toBe(false);
    expect(giftListUpdateMany.mock.calls[0][0].where.planType).toBeNull();
  });

  it('redeems an attached discount code exactly once, inside the transition', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, discountCodeId: 7 });

    await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(discountCodeUpdate).toHaveBeenCalledTimes(1);
    expect(discountCodeUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { usageCount: { increment: 1 } },
    });
  });

  it('does not redeem the code on a replayed publish', async () => {
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindUnique.mockResolvedValue({ userId: 1, planType: 'COMMISSION' });

    await publishGiftList({ giftListId: 10, userId: 1, planType: 'COMMISSION' });

    expect(discountCodeUpdate).not.toHaveBeenCalled();
  });

  it('still reports success when the confirmation email fails', async () => {
    (emailService.sendGiftListCreationEmail as any).mockRejectedValueOnce(new Error('postmark down'));

    const result = await publishGiftList({ giftListId: 10, userId: 1, planType: 'FIXED', amount: 2000 });

    // The couple has paid and the registry is live; an email failure must not
    // roll that back.
    expect(result.ok).toBe(true);
  });
});
