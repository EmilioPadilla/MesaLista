import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S5 / TEST-S6 — the fixed-plan upgrade path, and the regression that
// matters most in this migration.
//
// Under the old flow, paying for the fixed plan CREATED the user and their list
// from Stripe metadata, deduplicating on `findFirst({ userId, planType: 'FIXED' })`.
// That was safe only because a user reaching it had no lists at all. Now they
// hold a draft, which that narrower check does not match — so the old code would
// happily create a SECOND list beside it. These tests pin `giftList.create` to
// zero calls on the upgrade path.

const giftListFindFirst = vi.fn();
const giftListCreate = vi.fn();
const giftListUpdateMany = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const publishGiftListRecord = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = {
      findFirst: giftListFindFirst,
      create: giftListCreate,
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: giftListUpdateMany,
    };
    user = { findUnique: userFindUnique, create: userCreate };
    discountCode = { update: vi.fn() };
    cart = { findUnique: vi.fn() };
    payment = { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() };
    pendingPlanSignup = { findUnique: vi.fn(), upsert: vi.fn(), delete: vi.fn() };
    $transaction = vi.fn();
  },
}));

vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: publishGiftListRecord }));

// The controller builds its Stripe client at module load, so the mock has to
// close over stable fns — mutating the prototype later never reaches it.
const stripeSessionRetrieve = vi.fn();
const stripeSessionCreate = vi.fn();
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: stripeSessionCreate, retrieve: stripeSessionRetrieve } };
    webhooks = { constructEvent: vi.fn() };
  },
}));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../services/emailService.js', () => ({
  default: {
    sendAdminGiftListCreatedNotification: vi.fn().mockResolvedValue(undefined),
    sendAdminGiftListPublishedNotification: vi.fn().mockResolvedValue(undefined),
    sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined),
    sendPaymentConfirmationEmail: vi.fn(),
  },
}));
vi.mock('../services/pushService.js', () => ({ default: { sendGiftReceivedPush: vi.fn() } }));
vi.mock('../services/discountCodeService.js', () => ({ discountCodeService: { validateDiscountCode: vi.fn() } }));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn().mockResolvedValue({ token: 'tok' }) }));
vi.mock('../lib/paymentFees.js', () => ({
  reconcileStripeFee: vi.fn(),
  reconcilePayPalFee: vi.fn(),
  stripeMexicoGross: vi.fn(),
  paypalMexicoGross: vi.fn(),
}));

const paymentController = (await import('./paymentController.js')).default;

// The provisioning helper is module-private; exercise it through the public
// completion endpoint that the Stripe success page calls.
const completeSession = paymentController.completePlanSignupSession;

const user = { id: 1, email: 'maria@example.com', firstName: 'Maria', lastName: 'Gonzalez', slug: 'maria-gonzalez', role: 'COUPLE' };

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (body: Record<string, unknown>) => ({
  body,
  get: () => 'vitest-agent',
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
});

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(user);
  giftListUpdateMany.mockResolvedValue({ count: 0 });
  publishGiftListRecord.mockResolvedValue({
    ok: true,
    giftList: { id: 10, title: 'Mesa', coupleName: 'Maria y Juan', eventDate: new Date(), planType: 'FIXED', publishedAt: new Date() },
  });
});

/** Stripe session for a couple publishing their existing draft. */
const upgradeSession = {
  metadata: { paymentFor: 'PLAN_UPGRADE', planType: 'FIXED', userId: '1', giftListId: '10' },
  payment_status: 'paid',
  amount_total: 200000,
};

describe('fixed-plan upgrade provisioning', () => {
  it('publishes the existing draft instead of creating a second list', async () => {
    stripeSessionRetrieve.mockResolvedValue(upgradeSession);

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    // THE assertion: no list is ever created on the upgrade path.
    expect(giftListCreate).not.toHaveBeenCalled();
    expect(publishGiftListRecord).toHaveBeenCalledWith({
      giftListId: 10,
      userId: 1,
      planType: 'FIXED',
      amount: 2000,
    });
  });

  it('treats a replayed webhook as a no-op rather than an error', async () => {
    stripeSessionRetrieve.mockResolvedValue(upgradeSession);

    // A replay finds the list already published; the service reports it and the
    // endpoint must still succeed without touching anything.
    publishGiftListRecord.mockResolvedValue({ ok: false, reason: 'ALREADY_PUBLISHED' });

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    expect(giftListCreate).not.toHaveBeenCalled();
  });

  it('drops a code this payment never applied before the publish redeems it', async () => {
    // Full price: nothing in the metadata, so any code still attached to the
    // draft comes from a checkout the couple abandoned (or an iOS IAP purchase,
    // where Apple's price can't take a code at all).
    stripeSessionRetrieve.mockResolvedValue(upgradeSession);

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    expect(giftListUpdateMany).toHaveBeenCalledWith({
      // `planType: null` keeps a replay from stripping the link off a list that
      // is already published, and whose code may already be redeemed.
      where: { id: 10, userId: 1, planType: null, discountCodeId: { not: null } },
      data: { discountCodeId: null },
    });
  });

  it('keeps the attachment when the session actually applied the code', async () => {
    stripeSessionRetrieve.mockResolvedValue({
      ...upgradeSession,
      metadata: { ...upgradeSession.metadata, discountCodeId: '7', discountCode: 'BODA10' },
      amount_total: 150000,
    });

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    // The charge was discounted, so the publish transaction should find the code
    // and redeem it.
    expect(giftListUpdateMany).not.toHaveBeenCalled();
    expect(publishGiftListRecord).toHaveBeenCalledWith(expect.objectContaining({ giftListId: 10, planType: 'FIXED' }));
  });

  it('rejects an unpaid session before publishing anything', async () => {
    stripeSessionRetrieve.mockResolvedValue({ ...upgradeSession, payment_status: 'unpaid' });

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(publishGiftListRecord).not.toHaveBeenCalled();
    expect(giftListUpdateMany).not.toHaveBeenCalled();
  });
});

describe('legacy pre-account provisioning (old App Store builds)', () => {
  it('publishes a pre-existing draft rather than creating a duplicate', async () => {
    stripeSessionRetrieve.mockResolvedValue({
      metadata: {
        paymentFor: 'PLAN_SUBSCRIPTION',
        email: 'maria@example.com',
        passwordHash: 'hashed',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        slug: 'maria-gonzalez',
      },
      payment_status: 'paid',
      amount_total: 200000,
    });

    // An old client paying against an account that already signed up through the
    // new flow: dedup must find the draft and publish it, not create a second list.
    giftListFindFirst.mockResolvedValue({
      id: 10,
      title: 'Mesa',
      coupleName: 'Maria y Juan',
      eventDate: new Date(),
      planType: null,
      publishedAt: null,
    });

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    expect(giftListCreate).not.toHaveBeenCalled();
    expect(publishGiftListRecord).toHaveBeenCalledWith(expect.objectContaining({ giftListId: 10, userId: 1, planType: 'FIXED' }));
  });

  it('dedups on any list the user owns, not just a FIXED one', async () => {
    stripeSessionRetrieve.mockResolvedValue({
      metadata: {
        paymentFor: 'PLAN_SUBSCRIPTION',
        email: 'maria@example.com',
        passwordHash: 'hashed',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        slug: 'maria-gonzalez',
      },
      payment_status: 'paid',
      amount_total: 200000,
    });

    giftListFindFirst.mockResolvedValue({
      id: 10,
      title: 'Mesa',
      coupleName: 'Maria y Juan',
      eventDate: new Date(),
      planType: 'COMMISSION',
      publishedAt: new Date(),
    });

    const res = makeRes();
    await completeSession(makeReq({ sessionId: 'cs_test_123' }) as any, res as any);

    // The dedup query must not be scoped to FIXED — that scoping is exactly what
    // let a second list be created beside a draft or commission list.
    expect(giftListFindFirst.mock.calls[0][0].where).toEqual({ userId: 1 });
    expect(giftListCreate).not.toHaveBeenCalled();
  });
});
