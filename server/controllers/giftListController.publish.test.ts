import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S2 / TEST-S3 — the publish endpoint. Commission publishes for free;
// FIXED must NOT be publishable here, because this endpoint verifies no payment.
// Without that guard anyone who can POST gets a $2,000 plan for nothing.

const publishGiftListRecord = vi.fn();

vi.mock('../services/giftListPublishService.js', () => ({
  publishGiftList: publishGiftListRecord,
}));

const giftListCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: giftListCreate,
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    };
    giftCategoryOnGift = { findMany: vi.fn() };
    gift = { findMany: vi.fn(), update: vi.fn() };
    $transaction = vi.fn();
  },
}));

const { default: giftListController } = await import('./giftListController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (body: Record<string, unknown>, opts: { userId?: number; giftListId?: string } = {}) => ({
  params: { giftListId: opts.giftListId ?? '10' },
  body,
  user: opts.userId === undefined ? { userId: 1 } : { userId: opts.userId },
});

beforeEach(() => {
  vi.clearAllMocks();
  publishGiftListRecord.mockResolvedValue({
    ok: true,
    giftList: { id: 10, title: 'Mesa', coupleName: 'Maria y Juan', eventDate: new Date(), planType: 'COMMISSION', publishedAt: new Date() },
  });
});

describe('POST /giftLists/:giftListId/publish', () => {
  it('publishes on the commission plan', async () => {
    const res = makeRes();
    await giftListController.publishGiftList(makeReq({ planType: 'COMMISSION' }) as any, res as any);

    expect(publishGiftListRecord).toHaveBeenCalledWith({ giftListId: 10, userId: 1, planType: 'COMMISSION' });
    expect(res.json).toHaveBeenCalled();
  });

  it('refuses to publish FIXED without a settled payment', async () => {
    const res = makeRes();
    await giftListController.publishGiftList(makeReq({ planType: 'FIXED' }) as any, res as any);

    // 402 Payment Required — the fixed plan is published by the payment
    // controller once Stripe or RevenueCat confirms the charge.
    expect(res.status).toHaveBeenCalledWith(402);
    expect(publishGiftListRecord).not.toHaveBeenCalled();
  });

  it('rejects an unknown plan type', async () => {
    const res = makeRes();
    await giftListController.publishGiftList(makeReq({ planType: 'FREE_FOREVER' }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(publishGiftListRecord).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const res = makeRes();
    const req = { params: { giftListId: '10' }, body: { planType: 'COMMISSION' } };
    await giftListController.publishGiftList(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(publishGiftListRecord).not.toHaveBeenCalled();
  });

  it('404s a list that is not ours', async () => {
    publishGiftListRecord.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });

    const res = makeRes();
    await giftListController.publishGiftList(makeReq({ planType: 'COMMISSION' }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('409s a second publish instead of re-publishing', async () => {
    publishGiftListRecord.mockResolvedValue({ ok: false, reason: 'ALREADY_PUBLISHED' });

    const res = makeRes();
    await giftListController.publishGiftList(makeReq({ planType: 'COMMISSION' }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('POST /giftLists (create)', () => {
  it('always creates a draft, ignoring any planType in the body', async () => {
    giftListCreate.mockResolvedValue({ id: 11 });

    const res = makeRes();
    const req = {
      body: {
        title: 'Mi mesa',
        coupleName: 'Maria y Juan',
        eventDate: '2026-12-01',
        // A client trying to hand itself a paid plan must be ignored — publish
        // is the only path to a plan, and it is the only one that takes payment.
        planType: 'FIXED',
      },
      user: { userId: 1 },
    };

    await giftListController.createGiftList(req as any, res as any);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.planType).toBeNull();
    expect(created.publishedAt).toBeNull();
    expect(created.isPublic).toBe(false);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
