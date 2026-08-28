import { describe, it, expect, vi, beforeEach } from 'vitest';

// What a couple may and may not do to a gift's funding shape.
//   * Creating/editing writes the three type columns as a UNIT, so switching away
//     from a fixed split actually clears `contributorTarget`.
//   * Omitting `giftType` on edit leaves the shape alone — that's what keeps the
//     App Store builds that predate group gifts from silently converting one back.
//   * Once real money is on a gift, its price and split are frozen: re-splitting a
//     gift guests have already paid into would rewrite what they bought.

const giftCreate = vi.fn();
const giftUpdateMany = vi.fn();
const giftFindUnique = vi.fn();
const giftFindFirst = vi.fn();
const giftListFindFirst = vi.fn();
const giftCategoryOnGiftDeleteMany = vi.fn();
const giftCategoryOnGiftCreate = vi.fn();
const giftCategoryFindUnique = vi.fn();
const giftCategoryCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    gift = { create: giftCreate, updateMany: giftUpdateMany, findUnique: giftFindUnique, findFirst: giftFindFirst };
    giftList = { findFirst: giftListFindFirst };
    giftCategoryOnGift = { deleteMany: giftCategoryOnGiftDeleteMany, create: giftCategoryOnGiftCreate };
    giftCategory = { findUnique: giftCategoryFindUnique, create: giftCategoryCreate };
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

const user = { userId: OWNER_ID, email: 'a@b.c', firstName: 'A', lastName: 'B', role: 'COUPLE' };

const currentGift = (over: any = {}) => ({
  giftType: 'SINGLE',
  price: 3000,
  amountFunded: 0,
  contributorTarget: null,
  minContribution: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  giftListFindFirst.mockResolvedValue({ id: LIST_ID });
  giftCreate.mockResolvedValue({ id: GIFT_ID, giftListId: LIST_ID });
  giftUpdateMany.mockResolvedValue({ count: 1 });
  giftFindUnique.mockResolvedValue({ id: GIFT_ID, categories: [] });
  giftFindFirst.mockResolvedValue(currentGift());
});

describe('createGift — gift type', () => {
  it('defaults to SINGLE when no type is sent (older clients)', async () => {
    const res = makeRes();
    await giftController.createGift({ user, body: { title: 'Sartenes', price: 800, giftListId: LIST_ID } } as any, res);

    expect(giftCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ giftType: 'SINGLE', contributorTarget: null, minContribution: null }),
      }),
    );
  });

  it('persists a fixed split with its share count', async () => {
    const res = makeRes();
    await giftController.createGift(
      {
        user,
        body: { title: 'Luna de miel', price: 3000, giftListId: LIST_ID, giftType: 'GROUP_FIXED', contributorTarget: 3 },
      } as any,
      res,
    );

    expect(giftCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ giftType: 'GROUP_FIXED', contributorTarget: 3, minContribution: null }),
      }),
    );
  });

  it('persists an open goal with its minimum', async () => {
    const res = makeRes();
    await giftController.createGift(
      {
        user,
        body: { title: 'Viaje', price: 20000, giftListId: LIST_ID, giftType: 'GROUP_OPEN', minContribution: 250 },
      } as any,
      res,
    );

    expect(giftCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ giftType: 'GROUP_OPEN', contributorTarget: null, minContribution: 250 }),
      }),
    );
  });

  it('rejects a fixed split with no share count', async () => {
    const res = makeRes();
    await giftController.createGift(
      { user, body: { title: 'Luna de miel', price: 3000, giftListId: LIST_ID, giftType: 'GROUP_FIXED' } } as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(giftCreate).not.toHaveBeenCalled();
  });

  it('rejects an unknown gift type', async () => {
    const res = makeRes();
    await giftController.createGift(
      { user, body: { title: 'X', price: 100, giftListId: LIST_ID, giftType: 'POTLUCK' } } as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(giftCreate).not.toHaveBeenCalled();
  });
});

describe('updateGift — gift type', () => {
  it('leaves the funding shape alone when giftType is omitted', async () => {
    const res = makeRes();
    await giftController.updateGift({ user, params: { id: String(GIFT_ID) }, body: { title: 'Nuevo' } } as any, res);

    const data = giftUpdateMany.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('giftType');
    expect(data).not.toHaveProperty('contributorTarget');
  });

  it('converts a single gift into a fixed split', async () => {
    const res = makeRes();
    await giftController.updateGift(
      { user, params: { id: String(GIFT_ID) }, body: { giftType: 'GROUP_FIXED', contributorTarget: 4 } } as any,
      res,
    );

    expect(giftUpdateMany.mock.calls[0][0].data).toMatchObject({ giftType: 'GROUP_FIXED', contributorTarget: 4 });
  });

  // Writing the three columns as a unit is what prevents a stale target from
  // resurfacing the next time the type changes.
  it('clears contributorTarget when converting back to a single gift', async () => {
    giftFindFirst.mockResolvedValue(currentGift({ giftType: 'GROUP_FIXED', contributorTarget: 4 }));
    const res = makeRes();

    await giftController.updateGift({ user, params: { id: String(GIFT_ID) }, body: { giftType: 'SINGLE' } } as any, res);

    expect(giftUpdateMany.mock.calls[0][0].data).toMatchObject({
      giftType: 'SINGLE',
      contributorTarget: null,
      minContribution: null,
    });
  });

  // The new shape has to be checked against the price arriving in the SAME
  // request, not the price still in the database.
  it('validates a new split against the price being set in the same request', async () => {
    const res = makeRes();
    // Gift is currently $3,000; this drops it to $1,000 while asking for a
    // $2,000 minimum contribution — impossible against the new price.
    await giftController.updateGift(
      { user, params: { id: String(GIFT_ID) }, body: { price: 1000, giftType: 'GROUP_OPEN', minContribution: 2000 } } as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(giftUpdateMany).not.toHaveBeenCalled();
  });

  it('404s for a gift the caller does not own', async () => {
    giftFindFirst.mockResolvedValue(null);
    const res = makeRes();

    await giftController.updateGift({ user, params: { id: String(GIFT_ID) }, body: { title: 'x' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(giftUpdateMany).not.toHaveBeenCalled();
  });
});

describe('updateGift — funding lock', () => {
  const funded = () => currentGift({ giftType: 'GROUP_FIXED', contributorTarget: 3, amountFunded: 1000 });

  it('refuses to re-split a gift that has received contributions', async () => {
    giftFindFirst.mockResolvedValue(funded());
    const res = makeRes();

    await giftController.updateGift(
      { user, params: { id: String(GIFT_ID) }, body: { giftType: 'GROUP_FIXED', contributorTarget: 5 } } as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(giftUpdateMany).not.toHaveBeenCalled();
  });

  it('refuses to change the price of a gift that has received contributions', async () => {
    giftFindFirst.mockResolvedValue(funded());
    const res = makeRes();

    await giftController.updateGift({ user, params: { id: String(GIFT_ID) }, body: { price: 9000 } } as any, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(giftUpdateMany).not.toHaveBeenCalled();
  });

  it('refuses to change the funding type of a gift that has received contributions', async () => {
    giftFindFirst.mockResolvedValue(funded());
    const res = makeRes();

    await giftController.updateGift(
      { user, params: { id: String(GIFT_ID) }, body: { giftType: 'GROUP_OPEN' } } as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });

  // The lock is about money, not about editing: everything cosmetic stays open.
  it('still allows cosmetic edits on a funded gift', async () => {
    giftFindFirst.mockResolvedValue(funded());
    const res = makeRes();

    await giftController.updateGift(
      {
        user,
        params: { id: String(GIFT_ID) },
        body: { title: 'Mejor título', description: 'Nueva desc', imageUrl: 'https://cdn/x.jpg', isMostWanted: true },
      } as any,
      res,
    );

    expect(res.status).not.toHaveBeenCalledWith(409);
    expect(giftUpdateMany.mock.calls[0][0].data).toMatchObject({ title: 'Mejor título', isMostWanted: true });
  });

  it('allows re-sending the SAME shape on a funded gift (a no-op save)', async () => {
    giftFindFirst.mockResolvedValue(funded());
    const res = makeRes();

    // The web modal posts the whole gift back, unchanged fields included.
    await giftController.updateGift(
      {
        user,
        params: { id: String(GIFT_ID) },
        body: { title: 'x', price: 3000, giftType: 'GROUP_FIXED', contributorTarget: 3 },
      } as any,
      res,
    );

    expect(res.status).not.toHaveBeenCalledWith(409);
    expect(giftUpdateMany).toHaveBeenCalled();
  });

  it('leaves an unfunded gift fully editable', async () => {
    giftFindFirst.mockResolvedValue(currentGift({ giftType: 'GROUP_FIXED', contributorTarget: 3, amountFunded: 0 }));
    const res = makeRes();

    await giftController.updateGift(
      {
        user,
        params: { id: String(GIFT_ID) },
        body: { price: 9000, giftType: 'GROUP_FIXED', contributorTarget: 5 },
      } as any,
      res,
    );

    expect(res.status).not.toHaveBeenCalledWith(409);
    expect(giftUpdateMany.mock.calls[0][0].data).toMatchObject({ price: 9000, contributorTarget: 5 });
  });
});
