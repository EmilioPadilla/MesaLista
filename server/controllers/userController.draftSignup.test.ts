import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S1 — Signup is free and produces a DRAFT list: no plan, not published,
// invisible to guests, and no discount code (that is a publish-time concern).
// The legacy /signup/commission route still has to publish a COMMISSION list on
// the spot for App Store builds <= 1.0.2 (18), discount code included.

const userCreate = vi.fn();
const giftListCreate = vi.fn();
const discountCodeUpdate = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  default: {
    user: { create: userCreate },
    giftList: { create: giftListCreate },
    discountCode: { update: discountCodeUpdate },
    $transaction: async (cb: (tx: any) => Promise<any>) =>
      cb({
        user: { create: userCreate },
        giftList: { create: giftListCreate },
        discountCode: { update: discountCodeUpdate },
      }),
  },
}));

vi.mock('bcrypt', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('../middleware/auth.js', () => ({
  createSessionAndSetCookie: vi.fn().mockResolvedValue({ token: 'tok' }),
  logoutSession: vi.fn(),
}));
vi.mock('../services/emailService.js', () => ({
  default: {
    sendGiftListCreationEmail: vi.fn().mockResolvedValue(undefined),
    sendDraftWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../services/passwordResetService.js', () => ({ default: {} }));
vi.mock('../services/passwordValidationService.js', () => ({ default: {} }));
vi.mock('../services/discountCodeService.js', () => ({
  discountCodeService: { validateDiscountCode: vi.fn() },
}));

const { userController } = await import('./userController.js');
const { discountCodeService } = await import('../services/discountCodeService.js');
const { default: emailService } = await import('../services/emailService.js');

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

const makeReq = (body: Record<string, unknown>) => ({
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
    publishedAt: data.publishedAt,
  }));
});

describe('POST /user/signup (draft signup)', () => {
  it('creates a list with no plan, unpublished and hidden from search', async () => {
    const res = makeRes();
    await userController.signupDraft(makeReq(signupBody) as any, res as any);

    expect(giftListCreate).toHaveBeenCalledTimes(1);
    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.planType).toBeNull();
    expect(created.publishedAt).toBeNull();
    expect(created.isPublic).toBe(false);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('sends the welcome email, not the plan confirmation', async () => {
    const res = makeRes();
    await userController.signupDraft(makeReq(signupBody) as any, res as any);

    expect(emailService.sendDraftWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendGiftListCreationEmail).not.toHaveBeenCalled();
  });

  it('ignores a discount code sent by an old client — codes belong to publish', async () => {
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({
      valid: true,
      discountCode: { id: 7, code: 'BODA10' },
    });

    const res = makeRes();
    await userController.signupDraft(makeReq({ ...signupBody, discountCode: 'BODA10' }) as any, res as any);

    // Nothing is charged at signup, so there is nothing to discount: the code is
    // neither validated, attached nor redeemed here. The couple enters it on the
    // publish screen, and the plan checkout attaches it to the draft.
    expect(discountCodeService.validateDiscountCode).not.toHaveBeenCalled();
    expect(giftListCreate.mock.calls[0][0].data.discountCodeId).toBeUndefined();
    expect(discountCodeUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not 400 on a stale or invalid code from an old client', async () => {
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({ valid: false, error: 'Código expirado' });

    const res = makeRes();
    await userController.signupDraft(makeReq({ ...signupBody, discountCode: 'NOPE' }) as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(userCreate).toHaveBeenCalledTimes(1);
  });
});

describe('POST /user/signup/commission (legacy, old App Store builds)', () => {
  it('still publishes a COMMISSION list straight out of signup', async () => {
    const res = makeRes();
    await userController.signupCommission(makeReq(signupBody) as any, res as any);

    const created = giftListCreate.mock.calls[0][0].data;
    expect(created.planType).toBe('COMMISSION');
    expect(created.publishedAt).toBeInstanceOf(Date);
    // Commission lists have always started hidden from public search.
    expect(created.isPublic).toBe(false);
  });

  it('redeems the discount code here, since there is no later publish step', async () => {
    (discountCodeService.validateDiscountCode as any).mockResolvedValue({
      valid: true,
      discountCode: { id: 7, code: 'BODA10' },
    });

    const res = makeRes();
    await userController.signupCommission(makeReq({ ...signupBody, discountCode: 'BODA10' }) as any, res as any);

    expect(discountCodeUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { usageCount: { increment: 1 } },
    });
  });

  it('sends the plan confirmation email, not the draft welcome', async () => {
    const res = makeRes();
    await userController.signupCommission(makeReq(signupBody) as any, res as any);

    expect(emailService.sendGiftListCreationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendDraftWelcomeEmail).not.toHaveBeenCalled();
  });
});
