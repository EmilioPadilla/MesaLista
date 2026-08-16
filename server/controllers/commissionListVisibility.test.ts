import { describe, it, expect, vi, beforeEach } from 'vitest';

// Commission lists are created hidden from the public search page (isPublic:false).
// The couple flips them public from Settings once the list is actually ready.
// Fixed-plan lists keep the schema default (public) — they are paid for up front.

const userCreate = vi.fn();
const giftListCreate = vi.fn();
const discountCodeUpdate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { create: userCreate };
    giftList = { create: giftListCreate };
    discountCode = { update: discountCodeUpdate };
    $transaction = async (cb: (tx: any) => Promise<any>) =>
      cb({
        user: { create: userCreate },
        giftList: { create: giftListCreate },
        discountCode: { update: discountCodeUpdate },
      });
  },
}));

vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('../middleware/auth.js', () => ({
  createSessionAndSetCookie: vi.fn().mockResolvedValue({ token: 'tok' }),
  logoutSession: vi.fn(),
}));
vi.mock('../services/emailService.js', () => ({
  default: { sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('../services/passwordResetService.js', () => ({ default: {} }));
vi.mock('../services/passwordValidationService.js', () => ({ default: {} }));
vi.mock('../services/discountCodeService.js', () => ({
  discountCodeService: { validateDiscountCode: vi.fn() },
}));

const { userController } = await import('./userController.js');
const { default: giftListController } = await import('./giftListController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const signupBody = {
  email: 'maria@example.com',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  password: 'Password123',
  phoneNumber: '5512345678',
  slug: 'maria-gonzalez',
};

const makeSignupReq = (body: Record<string, unknown>) => ({
  body,
  get: () => 'vitest-agent',
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
});

beforeEach(() => {
  vi.clearAllMocks();
  userCreate.mockResolvedValue({ id: 1, slug: 'maria-gonzalez' });
  giftListCreate.mockImplementation(async ({ data }: any) => ({
    id: 10,
    title: data.title,
    coupleName: data.coupleName,
    eventDate: data.eventDate,
    planType: data.planType,
  }));
});

describe('commission gift list visibility', () => {
  it('creates the signup list hidden from search', async () => {
    const res = makeRes();
    await userController.signupCommission(makeSignupReq({ ...signupBody }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.planType).toBe('COMMISSION');
    expect(created.isPublic).toBe(false);
  });

  it('hides lists created through POST /api/giftLists with a COMMISSION plan', async () => {
    const req: any = {
      user: { userId: 100 },
      body: { title: 'My List', coupleName: 'A & B', eventDate: '2026-12-01', planType: 'COMMISSION' },
    };
    const res = makeRes();
    await giftListController.createGiftList(req, res);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.isPublic).toBe(false);
  });

  it('leaves FIXED plan lists at the schema default (public)', async () => {
    const req: any = {
      user: { userId: 100 },
      body: { title: 'My List', coupleName: 'A & B', eventDate: '2026-12-01', planType: 'FIXED' },
    };
    const res = makeRes();
    await giftListController.createGiftList(req, res);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.isPublic).toBeUndefined();
  });
});
