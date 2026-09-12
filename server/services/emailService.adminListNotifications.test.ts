import { describe, it, expect, vi, beforeEach } from 'vitest';

// Covers the two admin notifications end to end: real template rendering, real
// payload assembly, with only Postmark and Prisma faked. The contract that
// matters most is the last one asserted here — neither method may throw, because
// they run inside signup, publish and the Stripe webhook, and an admin heads-up
// failing must never take any of those down.

const sendEmail = vi.fn();

vi.mock('postmark', () => ({
  default: {
    ServerClient: class {
      sendEmail = sendEmail;
      sendEmailBatch = vi.fn();
    },
  },
}));

const userFindUnique = vi.fn();
const giftCount = vi.fn();
const giftListFindUnique = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: userFindUnique, findMany: vi.fn() };
    gift = { count: giftCount };
    giftList = { findUnique: giftListFindUnique };
  },
}));

// The Postmark client is built at module load, so the key has to be set first.
process.env.POSTMARK_API_KEY = 'test-key';
process.env.BUSINESS_EMAIL = 'info@mesalista.com.mx';
process.env.FRONTEND_URL = 'https://mesalista.com.mx';

const { default: emailService } = await import('./emailService.js');

const couple = {
  email: 'maria@example.com',
  firstName: 'María',
  lastName: 'Pérez',
  phoneNumber: '+52 55 1234 5678',
  slug: 'maria-y-juan',
};

const list = {
  userId: 1,
  giftListId: 42,
  giftListTitle: 'Mesa de Regalos de María y Juan',
  coupleName: 'María y Juan',
  eventDate: new Date('2026-12-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue({});
  userFindUnique.mockResolvedValue(couple);
  giftCount.mockResolvedValue(23);
  giftListFindUnique.mockResolvedValue({ createdAt: new Date('2026-09-12T10:00:00Z') });
});

describe('sendAdminGiftListCreatedNotification', () => {
  it('emails the business inbox with the couple, the list and both links', async () => {
    await emailService.sendAdminGiftListCreatedNotification({ ...list, planType: null });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = sendEmail.mock.calls[0][0];
    expect(sent.To).toBe('info@mesalista.com.mx');
    expect(sent.Subject).toBe('[MesaLista] Nueva mesa creada - María y Juan');

    for (const body of [sent.HtmlBody, sent.TextBody]) {
      expect(body).toContain('maria@example.com');
      expect(body).toContain('Mesa de Regalos de María y Juan');
      expect(body).toContain('https://mesalista.com.mx/maria-y-juan/gestionar');
      expect(body).toContain('https://mesalista.com.mx/maria-y-juan/regalos?listId=42');
      // A draft is the whole point of this email arriving early.
      expect(body).toContain('Borrador');
      expect(body).not.toContain('undefined');
    }
  });

  it('marks a legacy create-and-publish list as already live', async () => {
    await emailService.sendAdminGiftListCreatedNotification({ ...list, planType: 'COMMISSION' });

    expect(sendEmail.mock.calls[0][0].TextBody).toContain('Publicada al crearse');
  });

  it('sends nothing when the user row is gone', async () => {
    userFindUnique.mockResolvedValue(null);

    await emailService.sendAdminGiftListCreatedNotification({ ...list, planType: null });

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('sendAdminGiftListPublishedNotification', () => {
  it('reports the plan, the amount charged and how full the list is', async () => {
    await emailService.sendAdminGiftListPublishedNotification({
      ...list,
      planType: 'FIXED',
      amount: 1800,
      publishedAt: new Date('2026-09-20T10:00:00Z'),
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = sendEmail.mock.calls[0][0];
    expect(sent.To).toBe('info@mesalista.com.mx');
    expect(sent.Subject).toBe('[MesaLista] Mesa publicada (Plan Fijo) - María y Juan');

    for (const body of [sent.HtmlBody, sent.TextBody]) {
      expect(body).toContain('Plan Fijo');
      expect(body).toContain('1,800');
      expect(body).toContain('23');
      // Created the 12th, published the 20th.
      expect(body).toContain('8 día(s)');
      expect(body).not.toContain('undefined');
    }
  });

  it('says "sin cobro" for a commission publish rather than showing $0', async () => {
    await emailService.sendAdminGiftListPublishedNotification({ ...list, planType: 'COMMISSION', amount: 0 });

    const sent = sendEmail.mock.calls[0][0];
    expect(sent.Subject).toBe('[MesaLista] Mesa publicada (Plan Comisión) - María y Juan');
    expect(sent.TextBody).toContain('Sin cobro al publicar');
  });

  it('skips the draft age when the list was born published', async () => {
    await emailService.sendAdminGiftListPublishedNotification({
      ...list,
      planType: 'FIXED',
      amount: 2000,
      publishedOnCreate: true,
    });

    expect(sendEmail.mock.calls[0][0].TextBody).toContain('Publicada al crearse');
  });
});

describe('admin notification failures', () => {
  // These run inside signup, publish and the Stripe webhook. A Postmark outage
  // or a bad query must not propagate — the couple's registry is live either way.
  it('swallows a Postmark failure on both methods', async () => {
    sendEmail.mockRejectedValue(new Error('postmark down'));

    await expect(emailService.sendAdminGiftListCreatedNotification({ ...list, planType: null })).resolves.toBeUndefined();
    await expect(
      emailService.sendAdminGiftListPublishedNotification({ ...list, planType: 'FIXED', amount: 2000 }),
    ).resolves.toBeUndefined();
  });

  it('swallows a database failure on both methods', async () => {
    userFindUnique.mockRejectedValue(new Error('db down'));
    giftCount.mockRejectedValue(new Error('db down'));

    await expect(emailService.sendAdminGiftListCreatedNotification({ ...list, planType: null })).resolves.toBeUndefined();
    await expect(
      emailService.sendAdminGiftListPublishedNotification({ ...list, planType: 'FIXED', amount: 2000 }),
    ).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
