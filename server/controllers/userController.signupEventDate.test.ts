import { describe, it, expect, vi, beforeEach } from 'vitest';

// signupCommission creates the couple's first gift list. Previously it always
// stamped a default event date (6 months out); now it honours an `eventDate`
// chosen in the signup form, falling back to the default when absent/invalid.

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
  default: {
    sendAdminGiftListCreatedNotification: vi.fn().mockResolvedValue(undefined),
    sendAdminGiftListPublishedNotification: vi.fn().mockResolvedValue(undefined),
    sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined),
  },
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
  phoneNumber: '5512345678',
  slug: 'maria-gonzalez',
};

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

describe('signupCommission event date', () => {
  it('stamps the gift list with the couple-provided event date', async () => {
    const eventDate = '2026-12-24T00:00:00.000Z';
    const req = makeReq({ ...baseBody, eventDate });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    expect(giftListCreate).toHaveBeenCalledTimes(1);
    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.eventDate).toBeInstanceOf(Date);
    expect(created.eventDate.toISOString()).toBe(eventDate);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('falls back to the default event date when none is provided', async () => {
    const req = makeReq({ ...baseBody });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.eventDate).toBeInstanceOf(Date);
    // Default is ~6 months out, i.e. comfortably in the future.
    expect(created.eventDate.getTime()).toBeGreaterThan(Date.now());
  });

  it('falls back to the default when the event date is unparseable', async () => {
    const req = makeReq({ ...baseBody, eventDate: 'not-a-date' });
    const res = makeRes();

    await userController.signupCommission(req as any, res as any);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.eventDate).toBeInstanceOf(Date);
    expect(Number.isNaN(created.eventDate.getTime())).toBe(false);
    expect(created.eventDate.getTime()).toBeGreaterThan(Date.now());
  });
});
