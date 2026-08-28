import { describe, it, expect, vi, beforeEach } from 'vitest';

// Group-gift contributions go through the ordinary cart. What must hold:
//   * the SERVER prices the line — a client can ask for 2 shares, never for a price;
//   * a stored line stays `price * quantity`, so checkout, the Stripe/PayPal line
//     items and the confirmation emails keep working untouched — they price off
//     the LINE, which is the only truthful source of money for a group gift;
//   * normal single gifts behave exactly as they did before any of this existed.

const giftFindUnique = vi.fn();
const cartFindUnique = vi.fn();
const cartCreate = vi.fn();
const cartUpdate = vi.fn();
const cartItemFindFirst = vi.fn();
const cartItemFindUnique = vi.fn();
const cartItemFindMany = vi.fn();
const cartItemCreate = vi.fn();
const cartItemUpdate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    gift = { findUnique: giftFindUnique };
    cart = { findUnique: cartFindUnique, create: cartCreate, update: cartUpdate };
    cartItem = {
      findFirst: cartItemFindFirst,
      findUnique: cartItemFindUnique,
      findMany: cartItemFindMany,
      create: cartItemCreate,
      update: cartItemUpdate,
    };
  },
}));

vi.mock('uuid', () => ({ v4: () => 'session-uuid' }));

const { default: cartController } = await import('./cartController.js');

const SESSION = 'guest-session';
const CART_ID = 42;
const GIFT_ID = 7;

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const giftRow = (over: any = {}) => ({
  id: GIFT_ID,
  title: 'Luna de miel',
  price: 3000,
  giftType: 'SINGLE',
  amountFunded: 0,
  contributorTarget: null,
  minContribution: null,
  isPurchased: false,
  giftListId: 5,
  giftList: { publishedAt: new Date('2026-01-01') },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  cartFindUnique.mockResolvedValue({ id: CART_ID, status: 'PENDING', giftListId: 5, items: [] });
  cartItemFindFirst.mockResolvedValue(null);
  cartItemCreate.mockResolvedValue({ id: 1, cartId: CART_ID });
  cartItemUpdate.mockResolvedValue({ id: 1, cartId: CART_ID });
  cartItemFindMany.mockResolvedValue([]);
  cartUpdate.mockResolvedValue({ id: CART_ID });
});

describe('addToCart — fixed-share gifts', () => {
  it('stores the server-computed share price and the requested share count', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_FIXED', contributorTarget: 3, price: 3000 }));
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, shares: 2 } } as any, res);

    expect(cartItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ giftId: GIFT_ID, price: 1000, quantity: 2 }),
      }),
    );
  });

  it('refuses to claim more shares than remain', async () => {
    giftFindUnique.mockResolvedValue(
      giftRow({ giftType: 'GROUP_FIXED', contributorTarget: 3, price: 3000, amountFunded: 2000 }),
    );
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, shares: 2 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(cartItemCreate).not.toHaveBeenCalled();
  });
});

describe('addToCart — open-goal gifts', () => {
  it('stores the chosen amount as a single unit', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_OPEN', price: 5000 }));
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, amount: 750 } } as any, res);

    expect(cartItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 750, quantity: 1 }) }),
    );
  });

  // The whole point of server-side pricing.
  it('ignores a client-sent price and clamps the amount to what is left', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_OPEN', price: 5000, amountFunded: 4200 }));
    const res = makeRes();

    await cartController.addToCart(
      { body: { giftId: GIFT_ID, sessionId: SESSION, amount: 99999, price: 1 } } as any,
      res,
    );

    expect(cartItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 800, quantity: 1 }) }),
    );
  });

  it('rejects an amount below the minimum', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_OPEN', price: 5000, minContribution: 500 }));
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, amount: 100 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(cartItemCreate).not.toHaveBeenCalled();
  });

  it('rejects a contribution to a gift that is already complete', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_OPEN', price: 5000, amountFunded: 5000 }));
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, amount: 100 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('addToCart — re-adding an item already in the cart', () => {
  it('REPLACES a group contribution rather than stacking it', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftType: 'GROUP_OPEN', price: 5000 }));
    cartItemFindFirst.mockResolvedValue({ id: 99, quantity: 1, price: 500 });
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, amount: 900 } } as any, res);

    // The sheet submits the guest's intended total; adding 500 + 900 would charge
    // them nearly double what they just confirmed on screen.
    expect(cartItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99 }, data: { quantity: 1, price: 900 } }),
    );
  });

  it('still ACCUMULATES quantity for a normal gift, as it always did', async () => {
    giftFindUnique.mockResolvedValue(giftRow());
    cartItemFindFirst.mockResolvedValue({ id: 99, quantity: 1, price: 3000 });
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, quantity: 2 } } as any, res);

    expect(cartItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99 }, data: { quantity: 3 } }),
    );
  });
});

describe('addToCart — normal gifts are untouched', () => {
  it('stores the gift price and requested quantity as before', async () => {
    giftFindUnique.mockResolvedValue(giftRow());
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION, quantity: 2 } } as any, res);

    expect(cartItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 3000, quantity: 2 }) }),
    );
  });

  it('still refuses a gift on an unpublished draft', async () => {
    giftFindUnique.mockResolvedValue(giftRow({ giftList: { publishedAt: null } }));
    const res = makeRes();

    await cartController.addToCart({ body: { giftId: GIFT_ID, sessionId: SESSION } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(cartItemCreate).not.toHaveBeenCalled();
  });
});

describe('updateCartItem', () => {
  it('re-prices a fixed-share line when the stepper changes the share count', async () => {
    cartItemFindUnique.mockResolvedValue({
      id: 99,
      cartId: CART_ID,
      price: 1000,
      quantity: 1,
      cart: { status: 'PENDING' },
      gift: giftRow({ giftType: 'GROUP_FIXED', contributorTarget: 3, price: 3000 }),
    });
    cartFindUnique.mockResolvedValue({ id: CART_ID, items: [] });
    const res = makeRes();

    await cartController.updateCartItem({ params: { id: '99' }, body: { quantity: 2 } } as any, res);

    expect(cartItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 2, price: 1000 } }),
    );
  });

  // A gift can fill up while the cart sits open; the stepper must re-check.
  it('refuses a stepper bump past the shares still available', async () => {
    cartItemFindUnique.mockResolvedValue({
      id: 99,
      cartId: CART_ID,
      price: 1000,
      quantity: 1,
      cart: { status: 'PENDING' },
      gift: giftRow({ giftType: 'GROUP_FIXED', contributorTarget: 3, price: 3000, amountFunded: 2000 }),
    });
    const res = makeRes();

    await cartController.updateCartItem({ params: { id: '99' }, body: { quantity: 3 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(cartItemUpdate).not.toHaveBeenCalled();
  });

  it('updates a normal gift quantity without touching its price', async () => {
    cartItemFindUnique.mockResolvedValue({
      id: 99,
      cartId: CART_ID,
      price: 3000,
      quantity: 1,
      cart: { status: 'PENDING' },
      gift: giftRow(),
    });
    cartFindUnique.mockResolvedValue({ id: CART_ID, items: [] });
    const res = makeRes();

    await cartController.updateCartItem({ params: { id: '99' }, body: { quantity: 4 } } as any, res);

    expect(cartItemUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { quantity: 4 } }));
  });

  it('still refuses to mutate a paid cart', async () => {
    cartItemFindUnique.mockResolvedValue({
      id: 99,
      cartId: CART_ID,
      price: 3000,
      quantity: 1,
      cart: { status: 'PAID' },
      gift: giftRow(),
    });
    const res = makeRes();

    await cartController.updateCartItem({ params: { id: '99' }, body: { quantity: 2 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(cartItemUpdate).not.toHaveBeenCalled();
  });
});
