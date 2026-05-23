import { describe, it, expect, vi, beforeEach } from 'vitest';

const giftListFindUnique = vi.fn();
const giftListFindMany = vi.fn();
const cartFindMany = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = { findUnique: giftListFindUnique, findMany: giftListFindMany };
    cart = { findMany: cartFindMany };
  },
}));

const { default: paymentAnalyticsService } = await import('./paymentAnalyticsService.js');

const GIFT_LIST_ID = 10;

const makeCart = ({
  paymentType,
  amount,
  transactionFee,
  netAmount,
  feeSource,
  items,
  itemGiftListId = GIFT_LIST_ID,
}: {
  paymentType: 'STRIPE' | 'PAYPAL';
  amount: number;
  transactionFee: number | null;
  netAmount: number | null;
  feeSource: 'reported' | 'estimated' | null;
  items: { id: number; price: number; quantity: number; title?: string }[];
  itemGiftListId?: number;
}) => ({
  id: 1,
  inviteeName: 'Diana Assad',
  inviteeEmail: 'diana@example.com',
  payment: {
    id: 100,
    status: 'PAID',
    paymentType,
    amount,
    transactionFee,
    netAmount,
    feeSource,
    createdAt: new Date('2026-04-14T00:00:00Z'),
  },
  items: items.map((it) => ({
    quantity: it.quantity,
    gift: { id: it.id, title: it.title ?? `Gift ${it.id}`, price: it.price, giftListId: itemGiftListId },
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getGiftListPaymentDetails — real fee reporting', () => {
  it('uses the real reported fee when feeSource is "reported" (couple absorbs)', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 2000,
        transactionFee: 90.26, // real fee from Stripe
        netAmount: 1909.74,
        feeSource: 'reported',
        items: [{ id: 1, price: 2000, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    expect(result).toHaveLength(1);
    expect(result[0].paymentFee).toBe(90.26);
    expect(result[0].netAmount).toBe(1909.74);
    expect(result[0].coupleReceives).toBe(1909.74); // FIXED plan, no commission
    expect(result[0].feeSource).toBe('reported');
  });

  it('uses the real reported fee when guest pays fees (catches the gross-up shortfall)', async () => {
    // Simulates the bug from the user's screenshot: gift = $2,000, guest charged $2,078 (gross-up),
    // but real Stripe fee = $90.26, leaving only $1,987.74 — a $12.26 leak.
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'guest' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 2078, // guest paid the gross-up amount
        transactionFee: 90.26,
        netAmount: 1987.74,
        feeSource: 'reported',
        items: [{ id: 1, price: 2000, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    expect(result[0].paymentFee).toBe(90.26);
    expect(result[0].netAmount).toBe(1987.74);
    // The leak is visible: couple expected to receive $2,000 but actually got $1,987.74
    expect(result[0].coupleReceives).toBeLessThan(2000);
  });

  it('prorates the real fee across multiple items by their share of gross', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 3000,
        transactionFee: 120,
        netAmount: 2880,
        feeSource: 'reported',
        items: [
          { id: 1, price: 1000, quantity: 1 }, // 1/3 of cart
          { id: 2, price: 2000, quantity: 1 }, // 2/3 of cart
        ],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    expect(result).toHaveLength(2);
    expect(result[0].paymentFee).toBe(40); // 120 * 1/3
    expect(result[1].paymentFee).toBe(80); // 120 * 2/3
    expect(result[0].netAmount).toBe(960); // 2880 * 1/3
    expect(result[1].netAmount).toBe(1920); // 2880 * 2/3
    expect(result[0].paymentFee + result[1].paymentFee).toBeCloseTo(120, 2);
    expect(result[0].netAmount + result[1].netAmount).toBeCloseTo(2880, 2);
  });

  it('falls back to formula-based estimate when feeSource is null (legacy payments)', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 2000,
        transactionFee: null,
        netAmount: null,
        feeSource: null, // legacy payment captured before reconciliation
        items: [{ id: 1, price: 2000, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    // Formula: 2000 * 0.036 + 3 = 75 (without IVA, matches existing estimate)
    expect(result[0].paymentFee).toBe(75);
    expect(result[0].netAmount).toBe(1925);
    expect(result[0].feeSource).toBe('estimated');
  });

  it('falls back to estimate when feeSource is "estimated" (defensive)', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'PAYPAL',
        amount: 2200,
        transactionFee: null,
        netAmount: null,
        feeSource: 'estimated',
        items: [{ id: 1, price: 2200, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    // PayPal formula: 2200 * 0.0399 + 4 = 91.78
    expect(result[0].paymentFee).toBeCloseTo(91.78, 1);
    expect(result[0].feeSource).toBe('estimated');
  });

  it('reports zero estimated fee when guest paid the fee on a legacy payment (couple already got full price)', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'guest' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 2078,
        transactionFee: null,
        netAmount: null,
        feeSource: null,
        items: [{ id: 1, price: 2000, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    // Legacy behavior: when guest pays fees, the old code assumed couple gets full gift price
    expect(result[0].paymentFee).toBe(0);
    expect(result[0].netAmount).toBe(2000);
    expect(result[0].feeSource).toBe('estimated');
  });

  it('surfaces orphan carts whose cart.giftListId is null but items still belong to the list', async () => {
    // Regression test for the bug where a payment got lost from the report because
    // removeFromCart cleared cart.giftListId to null after the cart was emptied around
    // a payment. The cart row still has the payment and the items still point to the
    // gift list — those must drive the analytics, not cart.giftListId.
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'guest' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'PAYPAL',
        amount: 2078,
        transactionFee: 90.26,
        netAmount: 1987.74,
        feeSource: 'reported',
        items: [{ id: 1, price: 2000, quantity: 1 }],
        // Items belong to GIFT_LIST_ID but the cart row itself has giftListId: null —
        // the new query in getGiftListPaymentDetails finds carts via items.gift.giftListId
        // so this case must still be returned.
        itemGiftListId: GIFT_LIST_ID,
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(GIFT_LIST_ID);

    expect(result).toHaveLength(1);
    expect(result[0].paymentFee).toBe(90.26);
    expect(result[0].netAmount).toBe(1987.74);

    // Verify the new query targets items.gift.giftListId, not cart.giftListId
    expect(cartFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PAID',
          items: { some: { gift: { giftListId: GIFT_LIST_ID } } },
        }),
      }),
    );
  });

  it('excludes items from foreign gift lists when a cart mixes lists (defensive)', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'FIXED', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      {
        id: 1,
        inviteeName: 'Mixed Cart',
        inviteeEmail: 'x@example.com',
        payment: {
          id: 100,
          status: 'PAID',
          paymentType: 'STRIPE',
          amount: 3000,
          transactionFee: 120,
          netAmount: 2880,
          feeSource: 'reported',
          createdAt: new Date('2026-04-14T00:00:00Z'),
        },
        items: [
          // Item belongs to the gift list being queried
          { quantity: 1, gift: { id: 1, title: 'Mine', price: 1000, giftListId: GIFT_LIST_ID } },
          // Foreign item — should be skipped from the report
          { quantity: 1, gift: { id: 2, title: 'Theirs', price: 2000, giftListId: 999 } },
        ],
      },
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(GIFT_LIST_ID);

    expect(result).toHaveLength(1);
    expect(result[0].giftId).toBe(1);
  });

  it('applies MesaLista commission on top of the real net for COMMISSION plan', async () => {
    giftListFindUnique.mockResolvedValue({ planType: 'COMMISSION', feePreference: 'couple' });
    cartFindMany.mockResolvedValue([
      makeCart({
        paymentType: 'STRIPE',
        amount: 2000,
        transactionFee: 90,
        netAmount: 1910,
        feeSource: 'reported',
        items: [{ id: 1, price: 2000, quantity: 1 }],
      }),
    ]);

    const result = await paymentAnalyticsService.getGiftListPaymentDetails(10);

    expect(result[0].paymentFee).toBe(90);
    expect(result[0].netAmount).toBe(1910);
    expect(result[0].mesaListaCommission).toBeCloseTo(1910 * 0.03, 2); // 57.30
    expect(result[0].coupleReceives).toBeCloseTo(1910 - 1910 * 0.03, 2); // 1852.70
  });
});

describe('getGiftListsPaymentAnalytics — orphan cart bucketing', () => {
  const baseGiftList = {
    id: GIFT_LIST_ID,
    title: 'Diana & Juan',
    coupleName: 'Diana y Juan',
    planType: 'FIXED',
    feePreference: 'guest',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    eventDate: new Date('2026-12-01T00:00:00Z'),
    user: { email: 'diana@example.com', slug: 'diana-juan' },
    discountCode: null,
    gifts: [
      { id: 1, isPurchased: true },
      { id: 2, isPurchased: false },
    ],
  };

  it('buckets a payment into the right gift list even when cart.giftListId is null', async () => {
    giftListFindMany.mockResolvedValue([baseGiftList]);
    // The PAID cart row has NO giftListId (null) — exactly the orphan state the bug created.
    cartFindMany.mockResolvedValue([
      {
        payment: { amount: 2078, paymentType: 'PAYPAL', status: 'PAID' },
        items: [{ gift: { giftListId: GIFT_LIST_ID } }],
      },
    ]);

    const result = await paymentAnalyticsService.getGiftListsPaymentAnalytics();

    expect(result).toHaveLength(1);
    // The PayPal payment was attributed to the gift list via items.gift.giftListId,
    // NOT via cart.giftListId (which was null on the mock).
    expect(result[0].grossPaypal).toBe(2078);
    expect(result[0].grossStripe).toBe(0);
    expect(result[0].grossTotal).toBe(2078);
  });

  it('does not attribute carts whose payment status is not PAID', async () => {
    giftListFindMany.mockResolvedValue([baseGiftList]);
    cartFindMany.mockResolvedValue([
      {
        payment: { amount: 2078, paymentType: 'PAYPAL', status: 'PENDING' },
        items: [{ gift: { giftListId: GIFT_LIST_ID } }],
      },
    ]);

    const result = await paymentAnalyticsService.getGiftListsPaymentAnalytics();

    expect(result[0].grossPaypal).toBe(0);
    expect(result[0].grossTotal).toBe(0);
  });

  it('skips carts whose items have no giftListId (genuinely unrecoverable orphan)', async () => {
    giftListFindMany.mockResolvedValue([baseGiftList]);
    // Cart still PAID but somehow the gift was deleted / detached — nothing to attribute to.
    cartFindMany.mockResolvedValue([
      {
        payment: { amount: 1000, paymentType: 'STRIPE', status: 'PAID' },
        items: [{ gift: { giftListId: null } }],
      },
    ]);

    const result = await paymentAnalyticsService.getGiftListsPaymentAnalytics();

    expect(result[0].grossStripe).toBe(0);
    expect(result[0].grossTotal).toBe(0);
  });

  it('attributes multiple payments to the correct lists by gift.giftListId', async () => {
    giftListFindMany.mockResolvedValue([
      { ...baseGiftList, id: 10, title: 'List A' },
      { ...baseGiftList, id: 20, title: 'List B' },
    ]);
    cartFindMany.mockResolvedValue([
      // Stripe → list 10, orphan (cart.giftListId null in real DB)
      {
        payment: { amount: 1000, paymentType: 'STRIPE', status: 'PAID' },
        items: [{ gift: { giftListId: 10 } }],
      },
      // PayPal → list 10
      {
        payment: { amount: 2000, paymentType: 'PAYPAL', status: 'PAID' },
        items: [{ gift: { giftListId: 10 } }],
      },
      // Stripe → list 20
      {
        payment: { amount: 500, paymentType: 'STRIPE', status: 'PAID' },
        items: [{ gift: { giftListId: 20 } }],
      },
    ]);

    const result = await paymentAnalyticsService.getGiftListsPaymentAnalytics();

    const listA = result.find((r) => r.id === 10)!;
    const listB = result.find((r) => r.id === 20)!;
    expect(listA.grossStripe).toBe(1000);
    expect(listA.grossPaypal).toBe(2000);
    expect(listA.grossTotal).toBe(3000);
    expect(listB.grossStripe).toBe(500);
    expect(listB.grossPaypal).toBe(0);
    expect(listB.grossTotal).toBe(500);
  });
});
