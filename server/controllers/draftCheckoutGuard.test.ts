import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S8 — a draft must never take a guest's money. The frontend hides an
// unpublished registry, but that is UI; these are the actual controls, asserted
// at both boundaries a guest can reach: adding to a cart and starting checkout.

const cartFindUnique = vi.fn();
const giftFindUnique = vi.fn();
const cartCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    cart = { findUnique: cartFindUnique, create: cartCreate, update: vi.fn() };
    gift = { findUnique: giftFindUnique, update: vi.fn() };
    cartItem = { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() };
    giftList = { findUnique: vi.fn(), findFirst: vi.fn() };
    user = { findUnique: vi.fn() };
    payment = { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() };
    discountCode = { update: vi.fn() };
    pendingPlanSignup = { findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn() };
    invitee = { findUnique: vi.fn() };
    $transaction = vi.fn();
  },
}));

vi.mock('../lib/prisma.js', () => ({
  default: {
    cart: { findUnique: cartFindUnique, create: cartCreate, update: vi.fn() },
    gift: { findUnique: giftFindUnique, update: vi.fn() },
    cartItem: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    giftList: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: vi.fn(), retrieve: vi.fn() } };
    webhooks = { constructEvent: vi.fn() };
  },
}));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn() } }));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: vi.fn() }));
vi.mock('../services/emailService.js', () => ({ default: {} }));
vi.mock('../services/pushService.js', () => ({ default: { sendGiftReceivedPush: vi.fn() } }));
vi.mock('../services/discountCodeService.js', () => ({ discountCodeService: { validateDiscountCode: vi.fn() } }));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn() }));
vi.mock('../lib/paymentFees.js', () => ({
  reconcileStripeFee: vi.fn(),
  reconcilePayPalFee: vi.fn(),
  stripeMexicoGross: vi.fn(),
  paypalMexicoGross: vi.fn(),
}));

const paymentController = (await import('./paymentController.js')).default;
const cartController = (await import('./cartController.js')).default;

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('adding a gift to a cart', () => {
  it('refuses a gift belonging to an unpublished registry', async () => {
    giftFindUnique.mockResolvedValue({
      id: 5,
      giftListId: 11,
      isPurchased: false,
      giftList: { id: 11, publishedAt: null },
    });

    const res = makeRes();
    await cartController.addToCart({ body: { giftId: 5, sessionId: 'sess-1' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
    // Refuse at the earliest boundary: no cart should ever exist for a draft.
    expect(cartCreate).not.toHaveBeenCalled();
  });

  it('allows a gift from a published registry', async () => {
    giftFindUnique.mockResolvedValue({
      id: 5,
      giftListId: 10,
      isPurchased: false,
      giftList: { id: 10, publishedAt: new Date('2026-08-01') },
    });
    cartFindUnique.mockResolvedValue(null);
    cartCreate.mockResolvedValue({ id: 1, sessionId: 'sess-1', giftListId: 10, status: 'PENDING' });

    const res = makeRes();
    await cartController.addToCart({ body: { giftId: 5, sessionId: 'sess-1' } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(409);
  });
});

describe('starting checkout', () => {
  it('refuses a cart whose registry is still a draft', async () => {
    cartFindUnique.mockResolvedValue({
      id: 1,
      items: [{ id: 1, quantity: 1, price: 500, gift: { id: 5, title: 'Regalo' } }],
      giftList: { id: 11, publishedAt: null, feePreference: 'couple' },
    });

    const res = makeRes();
    await paymentController.createCheckoutSession(
      { body: { cartId: 1, successUrl: 'https://x/s', cancelUrl: 'https://x/c' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
