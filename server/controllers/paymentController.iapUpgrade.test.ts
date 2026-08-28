import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S12 — the iOS fixed-plan IAP in UPGRADE mode. The couple already has an
// account, so `prepare` stores ids rather than a password hash, and `complete`
// must not publish anything until RevenueCat confirms the entitlement.

// `hasActiveFixedPlanEntitlement` bails out early without a key, which would
// make every verification look like a failed purchase. Set it before the
// controller module is imported and reads it.
process.env.REVENUECAT_SECRET_API_KEY = 'test-secret';

const pendingUpsert = vi.fn();
const pendingFindUnique = vi.fn();
const pendingDelete = vi.fn();
const giftListFindUnique = vi.fn();
const giftListUpdateMany = vi.fn();
const userFindUnique = vi.fn();
const publishGiftListRecord = vi.fn();
const axiosGet = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    pendingPlanSignup = { upsert: pendingUpsert, findUnique: pendingFindUnique, delete: pendingDelete };
    giftList = {
      findUnique: giftListFindUnique,
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: giftListUpdateMany,
    };
    user = { findUnique: userFindUnique, create: vi.fn() };
    discountCode = { update: vi.fn() };
    cart = { findUnique: vi.fn() };
    payment = { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() };
    $transaction = vi.fn();
  },
}));

vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: publishGiftListRecord }));
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: vi.fn(), retrieve: vi.fn() } };
    webhooks = { constructEvent: vi.fn() };
  },
}));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('axios', () => ({ default: { get: axiosGet, post: vi.fn() } }));
vi.mock('../services/emailService.js', () => ({ default: { sendGiftListCreationEmail: vi.fn() } }));
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

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (body: Record<string, unknown>, user?: { userId: number }) => ({
  body,
  user,
  get: () => 'vitest-agent',
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
});

beforeEach(() => {
  vi.clearAllMocks();
  giftListUpdateMany.mockResolvedValue({ count: 0 });
  userFindUnique.mockResolvedValue({ id: 1, slug: 'maria-y-juan', email: 'maria@example.com' });
  // The controller chains `.catch()` onto the delete, so it must be thenable.
  pendingDelete.mockResolvedValue(undefined);
  publishGiftListRecord.mockResolvedValue({
    ok: true,
    giftList: { id: 10, title: 'Mesa', coupleName: 'Maria y Juan', eventDate: new Date(), planType: 'FIXED', publishedAt: new Date() },
  });
});

describe('preparePlanIapSignup (upgrade mode)', () => {
  it('stores only ids — no credentials are involved once signed in', async () => {
    giftListFindUnique.mockResolvedValue({ id: 10, userId: 1, planType: null, publishedAt: null });

    const res = makeRes();
    await paymentController.preparePlanIapSignup(makeReq({ appUserId: 'user_1', giftListId: 10 }, { userId: 1 }) as any, res as any);

    const stored = pendingUpsert.mock.calls[0][0].create;
    expect(stored.userId).toBe(1);
    expect(stored.giftListId).toBe(10);
    expect(stored.passwordHash).toBeUndefined();
    expect(stored.email).toBeUndefined();
  });

  it('refuses a list owned by someone else', async () => {
    giftListFindUnique.mockResolvedValue({ id: 10, userId: 999, planType: null, publishedAt: null });

    const res = makeRes();
    await paymentController.preparePlanIapSignup(makeReq({ appUserId: 'user_1', giftListId: 10 }, { userId: 1 }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(pendingUpsert).not.toHaveBeenCalled();
  });

  it('refuses a list that is already published', async () => {
    giftListFindUnique.mockResolvedValue({ id: 10, userId: 1, planType: 'COMMISSION', publishedAt: new Date() });

    const res = makeRes();
    await paymentController.preparePlanIapSignup(makeReq({ appUserId: 'user_1', giftListId: 10 }, { userId: 1 }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(pendingUpsert).not.toHaveBeenCalled();
  });
});

describe('completePlanIapSignup (upgrade mode)', () => {
  it('does not publish when the entitlement cannot be verified', async () => {
    pendingFindUnique.mockResolvedValue({ appUserId: 'user_1', userId: 1, giftListId: 10 });
    // RevenueCat reports no entitlement for this app user.
    axiosGet.mockResolvedValue({ data: { subscriber: { entitlements: {} } } });

    const res = makeRes();
    await paymentController.completePlanIapSignup(makeReq({ appUserId: 'user_1' }) as any, res as any);

    // 402 Payment Required — never trust the client's word that a purchase landed.
    expect(res.status).toHaveBeenCalledWith(402);
    expect(publishGiftListRecord).not.toHaveBeenCalled();
    expect(pendingDelete).not.toHaveBeenCalled();
  });

  it('publishes the draft once the entitlement is confirmed', async () => {
    pendingFindUnique.mockResolvedValue({ appUserId: 'user_1', userId: 1, giftListId: 10 });
    axiosGet.mockResolvedValue({ data: { subscriber: { entitlements: { fixed_plan: { expires_date: null } } } } });

    const res = makeRes();
    await paymentController.completePlanIapSignup(makeReq({ appUserId: 'user_1' }) as any, res as any);

    expect(publishGiftListRecord).toHaveBeenCalledWith(
      expect.objectContaining({ giftListId: 10, userId: 1, planType: 'FIXED' }),
    );
    expect(pendingDelete).toHaveBeenCalled();
  });

  it('drops a discount code the Apple price never honored', async () => {
    pendingFindUnique.mockResolvedValue({ appUserId: 'user_1', userId: 1, giftListId: 10 });
    axiosGet.mockResolvedValue({ data: { subscriber: { entitlements: { fixed_plan: { expires_date: null } } } } });

    const res = makeRes();
    await paymentController.completePlanIapSignup(makeReq({ appUserId: 'user_1' }) as any, res as any);

    // Apple sets the IAP price, so a code can never apply here — the app hides
    // the field on iOS. A draft that picked one up from a Stripe checkout started
    // on another device must not have it redeemed by this full-price purchase.
    expect(giftListUpdateMany).toHaveBeenCalledWith({
      where: { id: 10, userId: 1, planType: null, discountCodeId: { not: null } },
      data: { discountCodeId: null },
    });
  });

  it('does not mint a second session for an already signed-in couple', async () => {
    pendingFindUnique.mockResolvedValue({ appUserId: 'user_1', userId: 1, giftListId: 10 });
    axiosGet.mockResolvedValue({ data: { subscriber: { entitlements: { fixed_plan: { expires_date: null } } } } });

    const res = makeRes();
    await paymentController.completePlanIapSignup(makeReq({ appUserId: 'user_1' }) as any, res as any);

    // The upgrade response carries no token — the app already holds one.
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.token).toBeUndefined();
  });
});
