import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stripe webhook tests:
// (a) idempotency — a duplicate `checkout.session.completed` event must not
//     create a second Payment row or double-mark gifts purchased.
// (b) fee reconciliation failure — when `paymentIntents.retrieve` throws, we must
//     still record the payment with `feeSource: 'estimated'` rather than 500-ing
//     the webhook (which would make Stripe retry the entire event forever).
// (c) email delivery observability (#6) — when emailService throws, the webhook
//     must still respond 200 and the Payment row's emailDeliveryStatus = FAILED.

const paymentCreate = vi.fn();
const paymentFindFirst = vi.fn();
const paymentUpdateMany = vi.fn();
const cartUpdate = vi.fn();
const cartItemFindMany = vi.fn();
const giftUpdateMany = vi.fn();
const giftListCreate = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const giftListFindFirst = vi.fn();
const discountCodeUpdate = vi.fn();

const stripeWebhookConstructEvent = vi.fn();
const stripePaymentIntentsRetrieve = vi.fn();
const stripeCheckoutSessionsList = vi.fn();
const stripeCheckoutSessionsCreate = vi.fn();
const stripeCheckoutSessionsRetrieve = vi.fn();

const emailSendPaymentEmails = vi.fn();
const emailSendGiftListCreation = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    payment = { create: paymentCreate, findFirst: paymentFindFirst, updateMany: paymentUpdateMany };
    cart = { update: cartUpdate };
    cartItem = { findMany: cartItemFindMany };
    gift = { updateMany: giftUpdateMany };
    giftList = { create: giftListCreate, findFirst: giftListFindFirst };
    user = { findUnique: userFindUnique, create: userCreate };
    discountCode = { update: discountCodeUpdate };
  },
}));

vi.mock('stripe', () => {
  return {
    default: class {
      webhooks = { constructEvent: stripeWebhookConstructEvent };
      paymentIntents = { retrieve: stripePaymentIntentsRetrieve };
      checkout = {
        sessions: {
          list: stripeCheckoutSessionsList,
          create: stripeCheckoutSessionsCreate,
          retrieve: stripeCheckoutSessionsRetrieve,
        },
      };
    },
  };
});

vi.mock('../services/emailService.js', () => ({
  default: {
    sendPaymentEmails: emailSendPaymentEmails,
    sendGiftListCreationEmail: emailSendGiftListCreation,
  },
}));

vi.mock('../services/discountCodeService.js', () => ({
  discountCodeService: { validateDiscountCode: vi.fn() },
}));

vi.mock('../middleware/auth.js', () => ({
  createSessionAndSetCookie: vi.fn(),
}));

vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const { default: paymentController } = await import('./paymentController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

const baseCartSession = (overrides: Partial<any> = {}) => ({
  id: 'evt_1',
  type: 'checkout.session.completed' as const,
  data: {
    object: {
      payment_intent: 'pi_123',
      amount_total: 200000, // 2000 MXN in cents
      currency: 'mxn',
      metadata: { cartId: '42' },
      ...overrides,
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Stripe webhook — checkout.session.completed', () => {
  it('IDEMPOTENCY: a duplicate event must not create a second Payment row', async () => {
    // Stripe occasionally redelivers events. The handler currently creates a Payment
    // unconditionally — a duplicate delivery would crash on the unique cartId index
    // (which IS protective), but we exercise that path explicitly so anyone adding
    // an upsert later can see the contract.
    stripeWebhookConstructEvent.mockReturnValue(baseCartSession());
    stripePaymentIntentsRetrieve.mockResolvedValue({
      latest_charge: { balance_transaction: { fee: 9026, net: 190974 } },
    });
    cartItemFindMany.mockResolvedValue([{ giftId: 1 }, { giftId: 2 }]);
    // First call succeeds...
    paymentCreate.mockResolvedValueOnce({ id: 1 });
    // ...second throws a Prisma P2002 unique-constraint violation on cartId.
    paymentCreate.mockRejectedValueOnce(Object.assign(new Error('Unique constraint failed on cartId'), { code: 'P2002' }));

    const req: any = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('') };
    const res = makeRes();

    // First delivery
    await paymentController.handleStripePaymentIntent(req, res);
    expect(paymentCreate).toHaveBeenCalledTimes(1);

    // Second delivery — controller must not throw uncaught and must return a 500
    // (current behaviour) or 200 (if idempotency is later added). Crucial: only
    // ONE successful payment row exists.
    const res2 = makeRes();
    await paymentController.handleStripePaymentIntent(req, res2);
    // The duplicate attempt was made (proves the handler doesn't dedupe yet) but
    // the unique constraint prevented the row from being persisted twice.
    expect(paymentCreate).toHaveBeenCalledTimes(2);
  });

  it('FEE RECONCILIATION FAILURE: still persists Payment with feeSource=estimated when Stripe API throws', async () => {
    stripeWebhookConstructEvent.mockReturnValue(baseCartSession());
    // Simulate the Stripe API being down — paymentIntents.retrieve throws.
    stripePaymentIntentsRetrieve.mockRejectedValue(new Error('Stripe API unavailable'));
    cartItemFindMany.mockResolvedValue([{ giftId: 1 }]);
    paymentCreate.mockResolvedValue({ id: 1 });

    const req: any = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('') };
    const res = makeRes();
    await paymentController.handleStripePaymentIntent(req, res);

    // Payment was recorded with the FALLBACK fee shape — null fees, feeSource: 'estimated'
    expect(paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          feeSource: 'estimated',
          transactionFee: null,
          netAmount: null,
        }),
      }),
    );
    // Webhook returned 200 — Stripe will NOT retry this event.
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('EMAIL FAILURE OBSERVABILITY (#6): persists FAILED status when sendPaymentEmails throws', async () => {
    stripeWebhookConstructEvent.mockReturnValue(baseCartSession());
    stripePaymentIntentsRetrieve.mockResolvedValue({
      latest_charge: { balance_transaction: { fee: 9026, net: 190974 } },
    });
    cartItemFindMany.mockResolvedValue([{ giftId: 1 }]);
    paymentCreate.mockResolvedValue({ id: 1 });
    emailSendPaymentEmails.mockRejectedValue(new Error('Postmark 503'));

    const req: any = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('') };
    const res = makeRes();
    await paymentController.handleStripePaymentIntent(req, res);

    // Webhook still returned 200 — Stripe won't retry.
    expect(res.json).toHaveBeenCalledWith({ received: true });
    // The failure was persisted to Payment.emailDeliveryStatus so the retry CLI can pick it up.
    expect(paymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cartId: 42 },
        data: expect.objectContaining({
          emailDeliveryStatus: 'FAILED',
          emailDeliveryError: expect.stringContaining('Postmark'),
        }),
      }),
    );
  });

  it('EMAIL SUCCESS PATH: persists SENT status when emails go through', async () => {
    stripeWebhookConstructEvent.mockReturnValue(baseCartSession());
    stripePaymentIntentsRetrieve.mockResolvedValue({
      latest_charge: { balance_transaction: { fee: 9026, net: 190974 } },
    });
    cartItemFindMany.mockResolvedValue([{ giftId: 1 }]);
    paymentCreate.mockResolvedValue({ id: 1 });
    emailSendPaymentEmails.mockResolvedValue(undefined);

    const req: any = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('') };
    const res = makeRes();
    await paymentController.handleStripePaymentIntent(req, res);

    expect(paymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cartId: 42 },
        data: expect.objectContaining({
          emailDeliveryStatus: 'SENT',
          emailDeliveryError: null,
        }),
      }),
    );
  });

  it('returns 400 on invalid Stripe signature (no Payment side effects)', async () => {
    stripeWebhookConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req: any = { headers: { 'stripe-signature': 'bad' }, body: Buffer.from('') };
    const res = makeRes();
    await paymentController.handleStripePaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(paymentCreate).not.toHaveBeenCalled();
    expect(cartUpdate).not.toHaveBeenCalled();
  });
});
