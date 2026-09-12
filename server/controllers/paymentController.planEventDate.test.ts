import { describe, it, expect, vi, beforeEach } from 'vitest';

// The FIXED-plan signup pays before the account exists, so the chosen event date
// has to survive the round-trip through Stripe: createPlanCheckoutSession stashes
// it in the session metadata, and the webhook provisioning reads it back when it
// finally creates the gift list.

const giftListCreate = vi.fn();
const giftListFindFirst = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const discountCodeUpdate = vi.fn();

const stripeWebhookConstructEvent = vi.fn();
const stripeCheckoutSessionsCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    payment = { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() };
    cart = { update: vi.fn(), findUnique: vi.fn() };
    cartItem = { findMany: vi.fn() };
    gift = { updateMany: vi.fn() };
    giftList = { create: giftListCreate, findFirst: giftListFindFirst };
    user = { findUnique: userFindUnique, create: userCreate };
    discountCode = { update: discountCodeUpdate };
  },
}));

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: stripeWebhookConstructEvent };
    paymentIntents = { retrieve: vi.fn() };
    checkout = {
      sessions: { list: vi.fn(), create: stripeCheckoutSessionsCreate, retrieve: vi.fn() },
    };
  },
}));

vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('../services/emailService.js', () => ({
  default: {
    sendAdminGiftListCreatedNotification: vi.fn().mockResolvedValue(undefined),
    sendAdminGiftListPublishedNotification: vi.fn().mockResolvedValue(undefined),
    sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../services/discountCodeService.js', () => ({
  discountCodeService: { validateDiscountCode: vi.fn() },
}));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn() }));
vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const { default: paymentController } = await import('./paymentController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  stripeCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_1', url: 'https://stripe.test/cs_1' });
});

describe('createPlanCheckoutSession event date', () => {
  it('forwards the chosen event date into the Stripe session metadata', async () => {
    const eventDate = '2026-12-24T00:00:00.000Z';
    const req: any = {
      body: {
        planType: 'FIXED',
        email: 'maria@example.com',
        password: 'Password123',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        phoneNumber: '5512345678',
        slug: 'maria-gonzalez',
        successUrl: 'https://app.test/ok',
        cancelUrl: 'https://app.test/cancel',
        eventDate,
      },
    };
    const res = makeRes();

    await paymentController.createPlanCheckoutSession(req, res);

    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledTimes(1);
    const { metadata } = stripeCheckoutSessionsCreate.mock.calls[0][0];
    expect(metadata.eventDate).toBe(eventDate);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('fixed-plan provisioning event date', () => {
  const eventDate = '2027-05-15T00:00:00.000Z';

  const planSession = () => ({
    id: 'evt_plan',
    type: 'checkout.session.completed' as const,
    data: {
      object: {
        amount_total: 200000,
        currency: 'mxn',
        metadata: {
          paymentFor: 'PLAN_SUBSCRIPTION',
          email: 'maria@example.com',
          passwordHash: 'hashed',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          phoneNumber: '5512345678',
          slug: 'maria-gonzalez',
          eventDate,
        },
      },
    },
  });

  it('creates the gift list with the event date carried in metadata', async () => {
    stripeWebhookConstructEvent.mockReturnValue(planSession());
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({ id: 5, email: 'maria@example.com', firstName: 'Maria', lastName: 'Gonzalez', slug: 'maria-gonzalez' });
    giftListFindFirst.mockResolvedValue(null);
    giftListCreate.mockImplementation(async ({ data }: any) => ({
      id: 20,
      title: data.title,
      coupleName: data.coupleName,
      eventDate: data.eventDate,
    }));

    const req: any = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('{}') };
    const res = makeRes();

    await paymentController.handleStripePaymentIntent(req, res);

    expect(giftListCreate).toHaveBeenCalledTimes(1);
    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.eventDate).toBeInstanceOf(Date);
    expect(created.eventDate.toISOString()).toBe(eventDate);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});
