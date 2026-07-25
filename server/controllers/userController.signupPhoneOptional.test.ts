import { describe, it, expect, vi, beforeEach } from 'vitest';

// App Store guideline 5.1.1(v) forbids requiring personal data the core flow
// doesn't need, so the iOS app omits `phoneNumber` when the couple leaves the
// field blank. signupCommission must accept that instead of 400-ing.

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

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (body: Record<string, unknown>) => ({
  body,
  get: () => 'jest-agent',
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
});

const baseBody = {
  email: 'maria@example.com',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  password: 'Password123',
  slug: 'maria-gonzalez',
};

beforeEach(() => {
  vi.clearAllMocks();
  userCreate.mockResolvedValue({ id: 1, slug: 'maria-gonzalez' });
  giftListCreate.mockResolvedValue({ id: 10, title: 'Mesa', coupleName: 'Maria Gonzalez', eventDate: new Date() });
});

describe('signupCommission phone number', () => {
  it('creates the account when no phone number is sent', async () => {
    const req = makeReq({ ...baseBody });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(userCreate.mock.calls[0][0].data.phoneNumber).toBeNull();
  });

  it('stores null rather than an empty string when the field is blank', async () => {
    const req = makeReq({ ...baseBody, phoneNumber: '' });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(userCreate.mock.calls[0][0].data.phoneNumber).toBeNull();
  });

  it('still stores a phone number when one is provided', async () => {
    const req = makeReq({ ...baseBody, phoneNumber: '5512345678' });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    expect(userCreate.mock.calls[0][0].data.phoneNumber).toBe('5512345678');
  });

  it('still rejects the fields that are genuinely required', async () => {
    const { slug: _slug, ...withoutSlug } = baseBody;
    const res = makeRes();

    await userController.signupCommission(makeReq(withoutSlug) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userCreate).not.toHaveBeenCalled();
  });
});
