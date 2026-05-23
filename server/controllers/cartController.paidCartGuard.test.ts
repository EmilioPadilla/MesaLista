import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma BEFORE importing the controller. The cartController instantiates
// `new PrismaClient()` at module load, so we need the constructor to return our mocks.
const cartFindUnique = vi.fn();
const cartItemFindUnique = vi.fn();
const cartItemDelete = vi.fn();
const cartItemUpdate = vi.fn();
const cartItemCreate = vi.fn();
const cartItemFindFirst = vi.fn();
const cartItemFindMany = vi.fn();
const giftFindUnique = vi.fn();
const cartCreate = vi.fn();
const cartUpdate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    cart = {
      findUnique: cartFindUnique,
      create: cartCreate,
      update: cartUpdate,
    };
    cartItem = {
      findUnique: cartItemFindUnique,
      delete: cartItemDelete,
      update: cartItemUpdate,
      create: cartItemCreate,
      findFirst: cartItemFindFirst,
      findMany: cartItemFindMany,
    };
    gift = { findUnique: giftFindUnique };
  },
}));

const { default: cartController } = await import('./cartController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cartController — guard against mutating PAID carts', () => {
  describe('removeFromCart', () => {
    it('refuses to remove an item when the cart is PAID (returns 409)', async () => {
      cartItemFindUnique.mockResolvedValue({
        id: 5,
        cartId: 1,
        cart: { status: 'PAID' },
      });

      const req: any = { params: { id: '5' } };
      const res = makeRes();
      await cartController.removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(cartItemDelete).not.toHaveBeenCalled();
    });

    it('allows removal when the cart is PENDING', async () => {
      cartItemFindUnique.mockResolvedValue({
        id: 5,
        cartId: 1,
        cart: { status: 'PENDING' },
      });
      cartItemDelete.mockResolvedValue({ id: 5 });
      cartFindUnique.mockResolvedValue({ id: 1, items: [{ id: 6 }] });

      const req: any = { params: { id: '5' } };
      const res = makeRes();
      await cartController.removeFromCart(req, res);

      expect(cartItemDelete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(res.status).not.toHaveBeenCalledWith(409);
    });

    it('also blocks CANCELLED carts (any non-PENDING status)', async () => {
      cartItemFindUnique.mockResolvedValue({
        id: 5,
        cartId: 1,
        cart: { status: 'CANCELLED' },
      });

      const req: any = { params: { id: '5' } };
      const res = makeRes();
      await cartController.removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(cartItemDelete).not.toHaveBeenCalled();
    });
  });

  describe('updateCartItem', () => {
    it('refuses to change quantity on a PAID cart (returns 409)', async () => {
      cartItemFindUnique.mockResolvedValue({
        id: 5,
        cartId: 1,
        cart: { status: 'PAID' },
      });

      const req: any = { params: { id: '5' }, body: { quantity: 3 } };
      const res = makeRes();
      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(cartItemUpdate).not.toHaveBeenCalled();
    });

    it('allows quantity update when the cart is PENDING', async () => {
      cartItemFindUnique.mockResolvedValue({
        id: 5,
        cartId: 1,
        cart: { status: 'PENDING' },
      });
      cartItemUpdate.mockResolvedValue({ id: 5, cartId: 1, quantity: 3 });
      cartFindUnique.mockResolvedValue({ id: 1, items: [] });

      const req: any = { params: { id: '5' }, body: { quantity: 3 } };
      const res = makeRes();
      await cartController.updateCartItem(req, res);

      expect(cartItemUpdate).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(409);
    });
  });

  describe('addToCart', () => {
    it('refuses to add an item to a PAID cart (returns 409)', async () => {
      giftFindUnique.mockResolvedValue({ id: 7, giftListId: 10, isPurchased: false, price: 100 });
      cartFindUnique.mockResolvedValue({ id: 1, status: 'PAID', giftListId: 10 });

      const req: any = { body: { giftId: 7, quantity: 1, sessionId: 'abc' } };
      const res = makeRes();
      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(cartItemCreate).not.toHaveBeenCalled();
      expect(cartItemUpdate).not.toHaveBeenCalled();
    });

    it('GOLDEN PATH: a brand new sessionId after payment creates a fresh cart (guard does not fire)', async () => {
      // After OrderConfirmation clears guestId and regenerates, the next addToCart
      // arrives with a SessionId the DB has never seen. findUnique returns null,
      // a fresh PENDING cart is created, my guard never even gets evaluated for
      // the old PAID cart. This is the path 100% of normal users take.
      giftFindUnique.mockResolvedValue({ id: 7, giftListId: 10, isPurchased: false, price: 100 });
      cartFindUnique
        // Initial lookup by the new sessionId — nothing exists yet
        .mockResolvedValueOnce(null)
        // After creation, the controller re-fetches the cart to return it
        .mockResolvedValueOnce({ id: 99, status: 'PENDING', items: [] });
      cartCreate.mockResolvedValue({ id: 99, status: 'PENDING', giftListId: 10 });
      cartItemFindFirst.mockResolvedValue(null);
      cartItemCreate.mockResolvedValue({ id: 1, gift: {} });
      cartItemFindMany.mockResolvedValue([{ price: 100, quantity: 1 }]);
      cartUpdate.mockResolvedValue({});

      const req: any = { body: { giftId: 7, quantity: 1, sessionId: 'freshly-regenerated-uuid' } };
      const res = makeRes();
      await cartController.addToCart(req, res);

      // The PAID-cart guard must NOT have fired — a fresh cart was created.
      expect(res.status).not.toHaveBeenCalledWith(409);
      expect(cartCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sessionId: 'freshly-regenerated-uuid' }) }),
      );
      expect(cartItemCreate).toHaveBeenCalled();
    });

    it('allows adding to a PENDING cart', async () => {
      giftFindUnique.mockResolvedValue({ id: 7, giftListId: 10, isPurchased: false, price: 100 });
      cartFindUnique.mockResolvedValue({ id: 1, status: 'PENDING', giftListId: 10 });
      cartItemFindFirst.mockResolvedValue(null);
      cartItemCreate.mockResolvedValue({ id: 99, gift: {} });
      cartItemFindMany.mockResolvedValue([{ price: 100, quantity: 1 }]);
      cartUpdate.mockResolvedValue({});
      // After the create + cart update, the controller calls cart.findUnique a second time
      // to return the updated cart. Reset the mock so the second call returns the final state.
      cartFindUnique
        .mockResolvedValueOnce({ id: 1, status: 'PENDING', giftListId: 10 })
        .mockResolvedValueOnce({ id: 1, items: [] });

      const req: any = { body: { giftId: 7, quantity: 1, sessionId: 'abc' } };
      const res = makeRes();
      await cartController.addToCart(req, res);

      expect(res.status).not.toHaveBeenCalledWith(409);
    });
  });
});
