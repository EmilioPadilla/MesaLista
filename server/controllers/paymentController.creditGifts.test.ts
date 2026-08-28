import { describe, it, expect, vi, beforeEach } from 'vitest';

// `creditGiftsForPaidCart` is the moment a group gift actually moves. The rules:
//   * a normal gift is marked purchased, exactly as before group gifts existed;
//   * a group gift accrues money and contributors instead;
//   * `isPurchased` — which every existing badge, filter, stat and export keys off
//     — flips for a group gift ONLY when its funding goal is reached;
//   * money is applied with an atomic increment, so two guests paying into the
//     same gift at once cannot clobber each other.

const cartItemFindMany = vi.fn();
const txGiftUpdateMany = vi.fn();
const txGiftUpdate = vi.fn();
const transaction = vi.fn(async (fn: any) => fn({ gift: { updateMany: txGiftUpdateMany, update: txGiftUpdate } }));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    cartItem = { findMany: cartItemFindMany };
    $transaction = transaction;
  },
}));

vi.mock('stripe', () => ({ default: class {
  webhooks = { constructEvent: vi.fn() };
  checkout = { sessions: { create: vi.fn(), list: vi.fn() } };
  paymentIntents = { retrieve: vi.fn() };
} }));
vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));
vi.mock('../services/emailService.js', () => ({ default: { sendPaymentEmails: vi.fn() } }));
vi.mock('../services/pushService.js', () => ({ default: { sendToUser: vi.fn() } }));
vi.mock('../services/discountCodeService.js', () => ({ discountCodeService: {} }));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn() }));
vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: vi.fn() }));

const { creditGiftsForPaidCart } = await import('./paymentController.js');

const CART_ID = 42;

const line = (over: any = {}) => ({
  giftId: 1,
  price: 1000,
  quantity: 1,
  gift: {
    id: 1,
    giftType: 'SINGLE',
    price: 3000,
    amountFunded: 0,
    contributorTarget: null,
    isPurchased: false,
  },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: the increment leaves the gift short of its goal.
  txGiftUpdate.mockResolvedValue({ id: 1, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 1000, isPurchased: false });
});

describe('creditGiftsForPaidCart — normal gifts', () => {
  it('marks a single gift purchased, as before', async () => {
    cartItemFindMany.mockResolvedValue([line({ giftId: 7, gift: { ...line().gift, id: 7 } })]);

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdateMany).toHaveBeenCalledWith({ where: { id: { in: [7] } }, data: { isPurchased: true } });
    expect(txGiftUpdate).not.toHaveBeenCalled();
  });

  it('marks every single gift in one query', async () => {
    cartItemFindMany.mockResolvedValue([
      line({ giftId: 7, gift: { ...line().gift, id: 7 } }),
      line({ giftId: 8, gift: { ...line().gift, id: 8 } }),
    ]);

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdateMany).toHaveBeenCalledWith({ where: { id: { in: [7, 8] } }, data: { isPurchased: true } });
  });

  it('does nothing for an empty cart', async () => {
    cartItemFindMany.mockResolvedValue([]);

    await creditGiftsForPaidCart(CART_ID);

    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('creditGiftsForPaidCart — group gifts', () => {
  it('credits the line total atomically and counts the contributor', async () => {
    cartItemFindMany.mockResolvedValue([
      line({
        giftId: 3,
        price: 1000,
        quantity: 2,
        gift: { id: 3, giftType: 'GROUP_FIXED', price: 3000, contributorTarget: 3, amountFunded: 0, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({
      id: 3,
      giftType: 'GROUP_FIXED',
      price: 3000,
      contributorTarget: 3,
      amountFunded: 2000,
      isPurchased: false,
    });

    await creditGiftsForPaidCart(CART_ID);

    // 2 shares × $1,000 — and `increment`, not a read-modify-write.
    expect(txGiftUpdate).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { amountFunded: { increment: 2000 }, contributorCount: { increment: 1 } },
    });
    // Still $1,000 short of the goal, so it must NOT be marked purchased.
    expect(txGiftUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not mark a partially funded gift as purchased', async () => {
    cartItemFindMany.mockResolvedValue([
      line({
        giftId: 3,
        price: 500,
        quantity: 1,
        gift: { id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 0, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({ id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 500, isPurchased: false });

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdate).toHaveBeenCalledTimes(1);
    expect(txGiftUpdateMany).not.toHaveBeenCalled();
  });

  it('marks the gift purchased once the goal is reached', async () => {
    cartItemFindMany.mockResolvedValue([
      line({
        giftId: 3,
        price: 1500,
        quantity: 1,
        gift: { id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 3500, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({ id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 5000, isPurchased: false });

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdate).toHaveBeenLastCalledWith({ where: { id: 3 }, data: { isPurchased: true } });
  });

  // The uneven-split case: 3 × $333.34 = $1,000.02, which must complete a
  // $1,000 gift rather than leaving it one cent short forever.
  it('completes an unevenly split gift on its final share', async () => {
    cartItemFindMany.mockResolvedValue([
      line({
        giftId: 3,
        price: 333.34,
        quantity: 1,
        gift: { id: 3, giftType: 'GROUP_FIXED', price: 1000, contributorTarget: 3, amountFunded: 666.68, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({
      id: 3,
      giftType: 'GROUP_FIXED',
      price: 1000,
      contributorTarget: 3,
      amountFunded: 1000.02,
      isPurchased: false,
    });

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdate).toHaveBeenLastCalledWith({ where: { id: 3 }, data: { isPurchased: true } });
  });

  it('does not re-mark a gift another payment already completed', async () => {
    cartItemFindMany.mockResolvedValue([
      line({
        giftId: 3,
        price: 500,
        quantity: 1,
        gift: { id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 4500, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({ id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 5000, isPurchased: true });

    await creditGiftsForPaidCart(CART_ID);

    expect(txGiftUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('creditGiftsForPaidCart — mixed carts', () => {
  it('settles normal and group gifts in the same transaction', async () => {
    cartItemFindMany.mockResolvedValue([
      line({ giftId: 7, gift: { id: 7, giftType: 'SINGLE', price: 800, amountFunded: 0, isPurchased: false } }),
      line({
        giftId: 3,
        price: 600,
        quantity: 1,
        gift: { id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 0, isPurchased: false },
      }),
    ]);
    txGiftUpdate.mockResolvedValue({ id: 3, giftType: 'GROUP_OPEN', price: 5000, amountFunded: 600, isPurchased: false });

    await creditGiftsForPaidCart(CART_ID);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txGiftUpdateMany).toHaveBeenCalledWith({ where: { id: { in: [7] } }, data: { isPurchased: true } });
    expect(txGiftUpdate).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { amountFunded: { increment: 600 }, contributorCount: { increment: 1 } },
    });
  });
});
