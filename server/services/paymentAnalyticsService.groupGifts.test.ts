import { describe, it, expect, vi, beforeEach } from 'vitest';

// The admin gift-payment report has to read money off the LINE, not off the gift.
// `gift.price` is the funding GOAL for a group gift, so pricing a report from it
// reports a $500 contribution toward a $3,000 honeymoon as $3,000 — and because
// the same figure prorates the real processor fee across a cart, one group line
// would corrupt the fee and net of every other line sitting beside it.

const giftListFindUnique = vi.fn();
const cartFindMany = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = { findUnique: giftListFindUnique, findMany: vi.fn() };
    cart = { findMany: cartFindMany };
    payment = { findMany: vi.fn() };
  },
}));

const { default: paymentAnalyticsService } = await import('./paymentAnalyticsService.js');

const LIST_ID = 1;

const gift = (id: number, title: string, price: number) => ({ id, title, price, giftListId: LIST_ID });

const paidCart = (items: any[], payment: Partial<any> = {}) => ({
  inviteeName: 'Mariana',
  inviteeEmail: 'mariana@example.com',
  items,
  payment: {
    id: 900,
    status: 'PAID',
    paymentType: 'STRIPE',
    feeSource: 'reported',
    transactionFee: 40,
    netAmount: 960,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    ...payment,
  },
});

describe('getGiftListPaymentDetails — group gifts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
  });

  it('reports an open contribution as the amount given, not the funding goal', async () => {
    cartFindMany.mockResolvedValue([
      // $500 chipped in toward a $3,000 goal: line price 500, quantity 1.
      paidCart([{ price: 500, quantity: 1, gift: gift(7, 'Luna de miel', 3000) }]),
    ]);

    const [detail] = await paymentAnalyticsService.getGiftListPaymentDetails(LIST_ID);

    expect(detail.paymentAmount).toBe(500);
    expect(detail.giftPrice).toBe(500);
  });

  it('reports fixed shares as shares bought, not the goal times the share count', async () => {
    cartFindMany.mockResolvedValue([
      // 2 of 3 shares of a $3,000 gift: line price 1000, quantity 2.
      paidCart([{ price: 1000, quantity: 2, gift: gift(8, 'Refrigerador', 3000) }]),
    ]);

    const [detail] = await paymentAnalyticsService.getGiftListPaymentDetails(LIST_ID);

    expect(detail.paymentAmount).toBe(2000);
  });

  it('does not let a group line skew the fee prorated to a single gift beside it', async () => {
    cartFindMany.mockResolvedValue([
      paidCart([
        { price: 500, quantity: 1, gift: gift(9, 'Licuadora', 500) },
        { price: 500, quantity: 1, gift: gift(10, 'Luna de miel', 3000) },
      ]),
    ]);

    const details = await paymentAnalyticsService.getGiftListPaymentDetails(LIST_ID);
    const single = details.find((d) => d.giftId === 9)!;

    // Real cart gross is $1,000, so the single gift carries half the $40 fee.
    // Pricing off gift.price would make the gross $3,500 and this fee $5.71.
    expect(single.paymentFee).toBe(20);
    expect(single.netAmount).toBe(480);
  });

  it('leaves a plain single gift reporting exactly as it always did', async () => {
    cartFindMany.mockResolvedValue([paidCart([{ price: 1000, quantity: 2, gift: gift(11, 'Vajilla', 1000) }])]);

    const [detail] = await paymentAnalyticsService.getGiftListPaymentDetails(LIST_ID);

    expect(detail.paymentAmount).toBe(2000);
    expect(detail.giftPrice).toBe(1000);
  });

  it('falls back to the gift price on a legacy line that stored none', async () => {
    cartFindMany.mockResolvedValue([paidCart([{ price: null, quantity: 1, gift: gift(12, 'Tostadora', 750) }])]);

    const [detail] = await paymentAnalyticsService.getGiftListPaymentDetails(LIST_ID);

    expect(detail.paymentAmount).toBe(750);
  });
});
