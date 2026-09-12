import { describe, it, expect, vi, beforeEach } from 'vitest';

// `createCheckoutSession` builds the Stripe line items from the cart. Gifts are
// always listed at face price; when feePreference = 'guest' the cart total is
// grossed up with the same formula the web/mobile checkouts display
// (stripeMexicoGross: 3.6% + $3 + 16% IVA, solved so the couple nets the
// subtotal) and the difference is appended as a "Comisión por procesamiento"
// line item. When feePreference = 'couple' the couple eats the fee at payout
// time. Verify the line items match that contract.

const cartFindUnique = vi.fn();
const stripeCheckoutSessionsCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    cart = { findUnique: cartFindUnique };
    payment = { findFirst: vi.fn() };
    cartItem = { findMany: vi.fn() };
    gift = { updateMany: vi.fn() };
    giftList = { findFirst: vi.fn(), create: vi.fn() };
    user = { findUnique: vi.fn(), create: vi.fn() };
    discountCode = { update: vi.fn() };
  },
}));

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: vi.fn() };
    paymentIntents = { retrieve: vi.fn() };
    checkout = {
      sessions: {
        list: vi.fn(),
        create: stripeCheckoutSessionsCreate,
        retrieve: vi.fn(),
      },
    };
  },
}));

vi.mock('../services/emailService.js', () => ({
  default: {
    sendAdminGiftListCreatedNotification: vi.fn().mockResolvedValue(undefined),
    sendAdminGiftListPublishedNotification: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../services/discountCodeService.js', () => ({
  discountCodeService: { validateDiscountCode: vi.fn() },
}));
vi.mock('../middleware/auth.js', () => ({ createSessionAndSetCookie: vi.fn() }));
vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const { default: paymentController } = await import('./paymentController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeCart = (feePreference: 'couple' | 'guest', items: { price: number; quantity: number; title?: string }[]) => ({
  id: 1,
  inviteeName: 'Alice',
  inviteeEmail: 'alice@example.com',
  phoneNumber: '5551234567',
  items: items.map((it, idx) => ({
    price: it.price,
    quantity: it.quantity,
    gift: { title: it.title ?? `Gift ${idx}`, imageUrl: null, description: null, price: it.price },
  })),
  giftList: { feePreference },
});

beforeEach(() => {
  vi.clearAllMocks();
  stripeCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_123', url: 'https://stripe.test/cs_123' });
});

describe('createCheckoutSession — guest-pays vs couple-absorbs line items', () => {
  it('COUPLE absorbs: line item unit_amount equals the raw gift price (cents)', async () => {
    cartFindUnique.mockResolvedValue(makeCart('couple', [{ price: 2000, quantity: 1, title: 'Toaster' }]));

    const req: any = { body: { cartId: 1, successUrl: 'https://x', cancelUrl: 'https://y' } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    const args = stripeCheckoutSessionsCreate.mock.calls[0][0];
    expect(args.line_items).toHaveLength(1);
    // 2000 MXN → 200000 cents, no gross-up
    expect(args.line_items[0].price_data.unit_amount).toBe(200000);
  });

  it('GUEST pays: gift stays at face price and the gross-up fee is its own line item', async () => {
    cartFindUnique.mockResolvedValue(makeCart('guest', [{ price: 2000, quantity: 1, title: 'Toaster' }]));

    const req: any = { body: { cartId: 1, successUrl: 'https://x', cancelUrl: 'https://y' } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    const args = stripeCheckoutSessionsCreate.mock.calls[0][0];
    expect(args.line_items).toHaveLength(2);
    expect(args.line_items[0].price_data.unit_amount).toBe(200000);
    // stripeMexicoGross(2000) = (2000 + 3·1.16) / (1 − 0.036·1.16) = 2090.79 → fee 90.79
    expect(args.line_items[1].price_data.product_data.name).toBe('Comisión por procesamiento');
    expect(args.line_items[1].price_data.unit_amount).toBe(9079);
    expect(args.line_items[1].quantity).toBe(1);
  });

  it('GUEST pays: gross-up is applied once on the cart total (single fee line item)', async () => {
    cartFindUnique.mockResolvedValue(
      makeCart('guest', [
        { price: 1000, quantity: 1, title: 'A' },
        { price: 3000, quantity: 1, title: 'B' },
      ]),
    );

    const req: any = { body: { cartId: 1 } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    const args = stripeCheckoutSessionsCreate.mock.calls[0][0];
    expect(args.line_items).toHaveLength(3);
    expect(args.line_items[0].price_data.unit_amount).toBe(100000);
    expect(args.line_items[1].price_data.unit_amount).toBe(300000);
    // stripeMexicoGross(4000) = 4177.95 → one fee line item of 177.95
    expect(args.line_items[2].price_data.unit_amount).toBe(17795);
  });

  it('defaults to "couple" feePreference when the gift list has none', async () => {
    cartFindUnique.mockResolvedValue({
      ...makeCart('couple', [{ price: 2000, quantity: 1 }]),
      giftList: null,
    });

    const req: any = { body: { cartId: 1 } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    const args = stripeCheckoutSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(200000); // no gross-up
  });

  it('returns 400 when the cart is empty', async () => {
    cartFindUnique.mockResolvedValue({ ...makeCart('couple', []), items: [] });

    const req: any = { body: { cartId: 1 } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(stripeCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('returns 404 when the cart does not exist', async () => {
    cartFindUnique.mockResolvedValue(null);

    const req: any = { body: { cartId: 999 } };
    const res = makeRes();
    await paymentController.createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(stripeCheckoutSessionsCreate).not.toHaveBeenCalled();
  });
});
