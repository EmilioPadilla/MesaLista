import { describe, it, expect, vi, beforeEach } from 'vitest';

// The phone number is optional at signup (App Store guideline 5.1.1(v)), so
// every leg of the fixed-plan flow has to survive its absence: the Stripe
// checkout session, the iOS IAP pending row, and the provisioning that reads
// the signup back out of metadata after the payment confirms.

const giftListCreate = vi.fn();
const giftListFindFirst = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const discountCodeUpdate = vi.fn();
const pendingPlanSignupUpsert = vi.fn();

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
    pendingPlanSignup = { upsert: pendingPlanSignupUpsert, findUnique: vi.fn(), delete: vi.fn() };
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

const checkoutBody = {
  planType: 'FIXED',
  email: 'maria@example.com',
  password: 'Password123',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  slug: 'maria-gonzalez',
  successUrl: 'https://app.test/ok',
  cancelUrl: 'https://app.test/cancel',
};

const iapBody = {
  appUserId: 'rc_user_1',
  email: 'maria@example.com',
  password: 'Password123',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  slug: 'maria-gonzalez',
};

beforeEach(() => {
  vi.clearAllMocks();
  stripeCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_1', url: 'https://stripe.test/cs_1' });
  userFindUnique.mockResolvedValue(null);
  pendingPlanSignupUpsert.mockResolvedValue({});
});

describe('createPlanCheckoutSession without a phone number', () => {
  it('creates the session and sends an empty metadata value', async () => {
    const res = makeRes();

    await paymentController.createPlanCheckoutSession({ body: { ...checkoutBody } } as any, res);

    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledTimes(1);
    // Stripe metadata values must be strings, so "absent" is an empty string here.
    expect(stripeCheckoutSessionsCreate.mock.calls[0][0].metadata.phoneNumber).toBe('');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('still rejects a signup missing a genuinely required field', async () => {
    const { slug: _slug, ...withoutSlug } = checkoutBody;
    const res = makeRes();

    await paymentController.createPlanCheckoutSession({ body: withoutSlug } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(stripeCheckoutSessionsCreate).not.toHaveBeenCalled();
  });
});

describe('preparePlanIapSignup without a phone number', () => {
  it('stashes the pending signup with a null phone number', async () => {
    const res = makeRes();

    await paymentController.preparePlanIapSignup({ body: { ...iapBody } } as any, res);

    expect(pendingPlanSignupUpsert).toHaveBeenCalledTimes(1);
    const { create, update } = pendingPlanSignupUpsert.mock.calls[0][0];
    expect(create.phoneNumber).toBeNull();
    expect(update.phoneNumber).toBeNull();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('keeps a phone number that was provided', async () => {
    const res = makeRes();

    await paymentController.preparePlanIapSignup({ body: { ...iapBody, phoneNumber: '5512345678' } } as any, res);

    expect(pendingPlanSignupUpsert.mock.calls[0][0].create.phoneNumber).toBe('5512345678');
  });

  it('still rejects a signup missing a genuinely required field', async () => {
    const { email: _email, ...withoutEmail } = iapBody;
    const res = makeRes();

    await paymentController.preparePlanIapSignup({ body: withoutEmail } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pendingPlanSignupUpsert).not.toHaveBeenCalled();
  });
});

describe('fixed-plan provisioning without a phone number', () => {
  const planSession = (metadata: Record<string, string>) => ({
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
          slug: 'maria-gonzalez',
          ...metadata,
        },
      },
    },
  });

  const provision = async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      id: 5,
      email: 'maria@example.com',
      firstName: 'Maria',
      lastName: 'Gonzalez',
      slug: 'maria-gonzalez',
    });
    giftListFindFirst.mockResolvedValue(null);
    giftListCreate.mockImplementation(async ({ data }: any) => ({
      id: 20,
      title: data.title,
      coupleName: data.coupleName,
      eventDate: data.eventDate,
    }));

    const res = makeRes();
    await paymentController.handleStripePaymentIntent({ headers: { 'stripe-signature': 'sig' }, body: Buffer.from('{}') } as any, res);
    return res;
  };

  it('provisions the account and gift list when the metadata carries no phone number', async () => {
    stripeWebhookConstructEvent.mockReturnValue(planSession({}));

    const res = await provision();

    // The regression this guards: a missing phone used to abort provisioning,
    // leaving a paid couple with no account.
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(userCreate.mock.calls[0][0].data.phoneNumber).toBeNull();
    expect(giftListCreate).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('provisions with an empty-string phone number (the IAP metadata shape)', async () => {
    stripeWebhookConstructEvent.mockReturnValue(planSession({ phoneNumber: '' }));

    await provision();

    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(userCreate.mock.calls[0][0].data.phoneNumber).toBeNull();
  });

  it('does not provision when the password hash is missing', async () => {
    stripeWebhookConstructEvent.mockReturnValue(planSession({ passwordHash: '' }));

    await provision();

    expect(userCreate).not.toHaveBeenCalled();
    expect(giftListCreate).not.toHaveBeenCalled();
  });
});
