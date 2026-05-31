import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the GiftModal "save doesn't take" bug. Two silent failures
// kept couples from editing a gift in place:
//   1. Clearing every category did nothing — the controller only replaced relationships
//      when the array was non-empty, conflating "field omitted" with "set to []".
//   2. Removing the image did nothing — the modal posted `imageUrl: ''` which Prisma
//      treated as a no-op rather than nulling the column.
// Both round trips look successful from the client, which is what made the couple
// resort to deleting and recreating gifts. These tests pin the contract end-to-end.

const giftUpdateMany = vi.fn();
const giftFindUnique = vi.fn();
const giftListFindFirst = vi.fn();
const giftCategoryOnGiftDeleteMany = vi.fn();
const giftCategoryOnGiftCreate = vi.fn();
const giftCategoryFindUnique = vi.fn();
const giftCategoryCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    gift = {
      updateMany: giftUpdateMany,
      findUnique: giftFindUnique,
    };
    giftList = {
      findFirst: giftListFindFirst,
    };
    giftCategoryOnGift = {
      deleteMany: giftCategoryOnGiftDeleteMany,
      create: giftCategoryOnGiftCreate,
    };
    giftCategory = {
      findUnique: giftCategoryFindUnique,
      create: giftCategoryCreate,
    };
  },
}));

const { default: giftController } = await import('./giftController.js');

const OWNER_ID = 100;
const GIFT_ID = 7;
const LIST_ID = 12;

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const reqAs = (extra: any = {}) => ({
  user: { userId: OWNER_ID, email: 'a@b.c', firstName: 'A', lastName: 'B', role: 'COUPLE' },
  params: { id: String(GIFT_ID) },
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default happy-path stubs so each test only overrides what matters to it.
  giftUpdateMany.mockResolvedValue({ count: 1 });
  giftCategoryOnGiftDeleteMany.mockResolvedValue({ count: 0 });
  giftCategoryOnGiftCreate.mockResolvedValue({});
  giftFindUnique.mockImplementation(({ select }: any) => {
    if (select?.giftListId) return Promise.resolve({ giftListId: LIST_ID });
    return Promise.resolve({ id: GIFT_ID, categories: [] });
  });
});

describe('giftController.updateGift — categories replacement', () => {
  it('clears every category when an empty array is sent (regression)', async () => {
    const req: any = reqAs({ body: { title: 'Mesa', categories: [] } });
    const res = makeRes();

    await giftController.updateGift(req, res);

    // The whole point of the fix: presence of `categories` in the payload is the
    // signal to replace, even when the array is empty.
    expect(giftCategoryOnGiftDeleteMany).toHaveBeenCalledWith({ where: { giftId: GIFT_ID } });
    // No new relationships should be created when clearing.
    expect(giftCategoryOnGiftCreate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });

  it('does NOT touch category relationships when categories is omitted entirely', async () => {
    const req: any = reqAs({ body: { title: 'Mesa nueva' } });
    const res = makeRes();

    await giftController.updateGift(req, res);

    // Without the field present we must leave existing tags alone, otherwise a
    // partial PATCH-style update from the UI would wipe data the user never touched.
    expect(giftCategoryOnGiftDeleteMany).not.toHaveBeenCalled();
    expect(giftCategoryOnGiftCreate).not.toHaveBeenCalled();
  });

  it('replaces categories when a non-empty array is sent (objects or strings)', async () => {
    giftCategoryFindUnique.mockResolvedValueOnce({ id: 1, name: 'Cocina' });
    giftCategoryFindUnique.mockResolvedValueOnce(null);
    giftCategoryCreate.mockResolvedValueOnce({ id: 2, name: 'Hogar' });

    const req: any = reqAs({
      body: { categories: [{ name: 'Cocina' }, 'Hogar'] },
    });
    const res = makeRes();
    await giftController.updateGift(req, res);

    expect(giftCategoryOnGiftDeleteMany).toHaveBeenCalledWith({ where: { giftId: GIFT_ID } });
    expect(giftCategoryOnGiftCreate).toHaveBeenCalledTimes(2);
    expect(giftCategoryOnGiftCreate).toHaveBeenCalledWith({
      data: { giftId: GIFT_ID, categoryId: 1, giftListId: LIST_ID },
    });
    expect(giftCategoryOnGiftCreate).toHaveBeenCalledWith({
      data: { giftId: GIFT_ID, categoryId: 2, giftListId: LIST_ID },
    });
  });

  it('caps category creation at 3 entries even if the client sends more', async () => {
    giftCategoryFindUnique.mockResolvedValue({ id: 99, name: 'x' });
    const req: any = reqAs({
      body: { categories: ['a', 'b', 'c', 'd', 'e'] },
    });
    const res = makeRes();
    await giftController.updateGift(req, res);

    expect(giftCategoryOnGiftCreate).toHaveBeenCalledTimes(3);
  });

  it('falls back to legacy `category` string when `categories` is omitted', async () => {
    giftCategoryFindUnique.mockResolvedValue({ id: 1, name: 'Único' });
    const req: any = reqAs({ body: { category: 'Único' } });
    const res = makeRes();
    await giftController.updateGift(req, res);

    expect(giftCategoryOnGiftDeleteMany).toHaveBeenCalled();
    expect(giftCategoryOnGiftCreate).toHaveBeenCalledTimes(1);
  });

  it('ignores whitespace-only category names without breaking the request', async () => {
    const req: any = reqAs({ body: { categories: ['', '   ', '\t'] } });
    const res = makeRes();
    await giftController.updateGift(req, res);

    // Field was present → wipe existing.
    expect(giftCategoryOnGiftDeleteMany).toHaveBeenCalledWith({ where: { giftId: GIFT_ID } });
    // …but there are no real names to attach.
    expect(giftCategoryOnGiftCreate).not.toHaveBeenCalled();
  });
});

describe('giftController.updateGift — image removal', () => {
  it('nulls imageUrl when the client sends an empty string (regression)', async () => {
    const req: any = reqAs({ body: { imageUrl: '' } });
    const res = makeRes();

    await giftController.updateGift(req, res);

    // The old controller short-circuited on `imageUrl !== undefined` AND let the
    // empty string flow through, which Prisma stored as ''. Now we coerce to null
    // so the gift card actually loses its image on save.
    const callArgs = giftUpdateMany.mock.calls[0][0];
    expect(callArgs.data).toHaveProperty('imageUrl', null);
  });

  it('preserves imageUrl when the field is omitted from the payload', async () => {
    const req: any = reqAs({ body: { title: 'Sin tocar imagen' } });
    const res = makeRes();

    await giftController.updateGift(req, res);

    const callArgs = giftUpdateMany.mock.calls[0][0];
    expect(callArgs.data).not.toHaveProperty('imageUrl');
  });

  it('sets a new imageUrl when a non-empty URL is sent', async () => {
    const req: any = reqAs({ body: { imageUrl: 'https://cdn.example/p.jpg' } });
    const res = makeRes();

    await giftController.updateGift(req, res);

    const callArgs = giftUpdateMany.mock.calls[0][0];
    expect(callArgs.data.imageUrl).toBe('https://cdn.example/p.jpg');
  });
});

describe('giftController.updateGift — scalar fields round-trip', () => {
  it('persists title, description, price, isMostWanted, imagePosition, imageScale', async () => {
    const req: any = reqAs({
      body: {
        title: 'Nuevo título',
        description: 'Nuevo desc',
        price: '1500',
        isMostWanted: true,
        imagePosition: 60,
        imageScale: 120,
        quantity: 2,
      },
    });
    const res = makeRes();
    await giftController.updateGift(req, res);

    const data = giftUpdateMany.mock.calls[0][0].data;
    expect(data.title).toBe('Nuevo título');
    expect(data.description).toBe('Nuevo desc');
    expect(data.price).toBe(1500);
    expect(data.isMostWanted).toBe(true);
    expect(data.imagePosition).toBe(60);
    expect(data.imageScale).toBe(120);
    expect(data.quantity).toBe(2);
  });

  it('allows clearing description via empty string', async () => {
    const req: any = reqAs({ body: { description: '' } });
    const res = makeRes();
    await giftController.updateGift(req, res);

    const data = giftUpdateMany.mock.calls[0][0].data;
    expect(data).toHaveProperty('description', '');
  });
});
