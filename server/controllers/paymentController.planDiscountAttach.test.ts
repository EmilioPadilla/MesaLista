import { describe, it, expect, vi, beforeEach } from 'vitest';

// The fixed-plan checkout is the only place a discount code gets attached to a
// draft, and `giftListPublishService` redeems whatever it finds attached once
// payment settles. So the attachment has to describe THIS checkout: a code left
// over from an abandoned attempt must not ride along on a full-price session and
// be redeemed for a discount nobody received.

const giftListFindUnique = vi.fn();
const giftListUpdate = vi.fn();
const stripeSessionCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = { findUnique: giftListFindUnique, update: giftListUpdate, findFirst: vi.fn(), create: vi.fn() };
    user = { findUnique: vi.fn(), create: vi.fn() };
    discountCode = { update: vi.fn() };
    cart = { findUnique: vi.fn() };
    payment = { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() };
    pendingPlanSignup = { findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn() };
    $transaction = vi.fn();
  },
}));

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: stripeSessionCreate, retrieve: vi.fn(), list: vi.fn() } };
    webhooks = { constructEvent: vi.fn() };
    paymentIntents = { retrieve: vi.fn() };
  },
}));

vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: vi.fn() }));
vi.mock('../services/emailService.js', () => ({ default: {} }));
vi.mock('../services/pushService.js', () => ({ default: { sendGiftReceivedPush: vi.fn() } }));
vi.mock('../services/discountCodeService.js', () => ({ discountCodeService: { validateDiscountCode: vi.fn() } }));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn() }));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../lib/paymentFees.js', () => ({
  reconcileStripeFee: vi.fn(),
  reconcilePayPalFee: vi.fn(),
  stripeMexicoGross: vi.fn(),
  paypalMexicoGross: vi.fn(),
}));

const { default: paymentController } = await import('./paymentController.js');
const { discountCodeService } = await import('../services/discountCodeService.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

/** An authenticated couple upgrading their own draft — the current flow. */
const makeReq = (body: Record<string, unknown> = {}) =>
  ({
    body: { planType: 'FIXED', giftListId: 10, successUrl: 'https://x', cancelUrl: 'https://y', ...body },
    user: { userId: 1 },
  }) as any;

const draft = { id: 10, userId: 1, planType: null, publishedAt: null, discountCodeId: null };

beforeEach(() => {
  vi.clearAllMocks();
  giftListFindUnique.mockResolvedValue(draft);
  giftListUpdate.mockResolvedValue({});
  stripeSessionCreate.mockResolvedValue({ id: 'cs_1', url: 'https://stripe.test/cs_1' });
});

describe('fixed-plan checkout — discount code attachment', () => {
  it('attaches a validated code and charges the discounted price', async () => {
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({
      valid: true,
      discountCode: { id: 7, code: 'BODA10', discountType: 'PERCENTAGE', discountValue: 25 },
    });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq({ discountCode: 'BODA10' }), res);

    expect(giftListUpdate).toHaveBeenCalledWith({ where: { id: 10 }, data: { discountCodeId: 7 } });
    const session = stripeSessionCreate.mock.calls[0][0];
    // $2,000 MXN less 25%, in cents.
    expect(session.line_items[0].price_data.unit_amount).toBe(150000);
    expect(session.metadata.discountCodeId).toBe('7');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('clears a code left over from an abandoned attempt when this checkout has none', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, discountCodeId: 7 });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq(), res);

    // Without this the publish transaction would redeem code 7 against a session
    // that charged full price.
    expect(giftListUpdate).toHaveBeenCalledWith({ where: { id: 10 }, data: { discountCodeId: null } });
    const session = stripeSessionCreate.mock.calls[0][0];
    expect(session.line_items[0].price_data.unit_amount).toBe(200000);
    expect(session.metadata.discountCodeId).toBeUndefined();
  });

  it('replaces the old code when the couple retries with a different one', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, discountCodeId: 7 });
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({
      valid: true,
      discountCode: { id: 9, code: 'OTRO', discountType: 'FIXED_AMOUNT', discountValue: 300 },
    });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq({ discountCode: 'OTRO' }), res);

    expect(giftListUpdate).toHaveBeenCalledWith({ where: { id: 10 }, data: { discountCodeId: 9 } });
    expect(stripeSessionCreate.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(170000);
  });

  it('does not rewrite the draft when the attachment is already correct', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, discountCodeId: 7 });
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({
      valid: true,
      discountCode: { id: 7, code: 'BODA10', discountType: 'PERCENTAGE', discountValue: 25 },
    });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq({ discountCode: 'BODA10' }), res);

    expect(giftListUpdate).not.toHaveBeenCalled();
  });

  it('leaves an unattached draft alone when no code is given', async () => {
    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq(), res);

    expect(giftListUpdate).not.toHaveBeenCalled();
    expect(discountCodeService.validateDiscountCode).not.toHaveBeenCalled();
  });

  it('rejects an invalid code without touching the draft or opening a session', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, discountCodeId: 7 });
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({ valid: false, error: 'Código expirado' });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq({ discountCode: 'NOPE' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(giftListUpdate).not.toHaveBeenCalled();
    expect(stripeSessionCreate).not.toHaveBeenCalled();
  });

  it('refuses a list that is already published', async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, planType: 'COMMISSION', publishedAt: new Date() });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq({ discountCode: 'BODA10' }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(giftListUpdate).not.toHaveBeenCalled();
    expect(stripeSessionCreate).not.toHaveBeenCalled();
  });

  it("refuses someone else's list", async () => {
    giftListFindUnique.mockResolvedValue({ ...draft, userId: 999 });

    const res = makeRes();
    await paymentController.createPlanCheckoutSession(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(giftListUpdate).not.toHaveBeenCalled();
    expect(stripeSessionCreate).not.toHaveBeenCalled();
  });
});
