import { describe, it, expect, vi, beforeEach } from 'vitest';

// Atomic fee-preference lock (#3). The pre-fix code read `gifts.isPurchased` then
// updated outside any transaction — two concurrent updates could both pass the
// check, OR a payment webhook could flip isPurchased between the read and the write.
// The fix expresses the lock as `gifts: { none: { isPurchased: true } }` in the
// update's where clause so the database itself enforces atomicity in one query.

const giftListUpdateMany = vi.fn();
const giftListFindUnique = vi.fn();
const giftListFindFirst = vi.fn();
const giftListFindMany = vi.fn();
const giftListCreate = vi.fn();
const giftListDeleteMany = vi.fn();
const giftListUpdate = vi.fn();
const giftListDelete = vi.fn();
const giftCreate = vi.fn();
const giftUpdateMany = vi.fn();
const giftDeleteMany = vi.fn();
const giftFindUnique = vi.fn();
const giftFindMany = vi.fn();
const giftCategoryOnGiftFindMany = vi.fn();
const transactionMock = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = {
      updateMany: giftListUpdateMany,
      findUnique: giftListFindUnique,
      findFirst: giftListFindFirst,
      findMany: giftListFindMany,
      create: giftListCreate,
      deleteMany: giftListDeleteMany,
      update: giftListUpdate,
      delete: giftListDelete,
    };
    gift = {
      create: giftCreate,
      updateMany: giftUpdateMany,
      deleteMany: giftDeleteMany,
      findUnique: giftFindUnique,
      findMany: giftFindMany,
    };
    giftCategoryOnGift = { findMany: giftCategoryOnGiftFindMany };
    $transaction = transactionMock;
  },
}));

const { default: giftListController } = await import('./giftListController.js');

const OWNER_ID = 100;
const LIST_ID = 10;

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const reqAs = (userId: number, extra: any = {}) => ({
  user: { userId, email: 'x@y.z', firstName: 'A', lastName: 'B', role: 'COUPLE' },
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fee-preference lock — atomic conditional update', () => {
  it('embeds `gifts: { none: { isPurchased: true } }` in the update where', async () => {
    // The lock condition must live in the SQL where, not a JS branch after a read.
    giftListUpdateMany.mockResolvedValue({ count: 1 });
    giftListFindUnique.mockResolvedValue({ id: LIST_ID, feePreference: 'guest' });

    const req: any = reqAs(OWNER_ID, {
      params: { giftListId: String(LIST_ID) },
      body: { feePreference: 'guest' },
    });
    const res = makeRes();
    await giftListController.updateGiftList(req, res);

    expect(giftListUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: LIST_ID,
          userId: OWNER_ID,
          gifts: { none: { isPurchased: true } },
        }),
        data: expect.objectContaining({ feePreference: 'guest' }),
      }),
    );
  });

  it('returns 403 when the update affects 0 rows AND the list does exist (lock blocked it)', async () => {
    // Simulate: list exists and is owned by the caller, but a gift was just purchased
    // between the user's click and the request — Prisma's atomic where excludes the row.
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindFirst.mockResolvedValue({ id: LIST_ID }); // disambiguation: list exists & owned

    const req: any = reqAs(OWNER_ID, {
      params: { giftListId: String(LIST_ID) },
      body: { feePreference: 'guest' },
    });
    const res = makeRes();
    await giftListController.updateGiftList(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const body = res.json.mock.calls[0][0];
    expect(body.error).toMatch(/comisiones/i); // user-facing reason
  });

  it('returns 404 when the update affects 0 rows AND the list does not exist for this owner', async () => {
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindFirst.mockResolvedValue(null); // not found / not owned

    const req: any = reqAs(OWNER_ID, {
      params: { giftListId: String(LIST_ID) },
      body: { feePreference: 'guest' },
    });
    const res = makeRes();
    await giftListController.updateGiftList(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('does NOT add the gifts-none guard when feePreference is unchanged in the request', async () => {
    // Editing title/description must not pay the gifts-subquery cost.
    giftListUpdateMany.mockResolvedValue({ count: 1 });
    giftListFindUnique.mockResolvedValue({ id: LIST_ID });

    const req: any = reqAs(OWNER_ID, {
      params: { giftListId: String(LIST_ID) },
      body: { title: 'Renamed' },
    });
    const res = makeRes();
    await giftListController.updateGiftList(req, res);

    const where = giftListUpdateMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('gifts');
    expect(where).toMatchObject({ id: LIST_ID, userId: OWNER_ID });
  });

  it('simulates a race: webhook flips isPurchased between read and write', async () => {
    // Before the fix, this scenario silently let the change through. After the fix,
    // Prisma's atomic where rejects the update (count: 0) because a row with
    // isPurchased: true exists at the moment of the UPDATE.
    giftListUpdateMany.mockResolvedValue({ count: 0 });
    giftListFindFirst.mockResolvedValue({ id: LIST_ID });

    const req: any = reqAs(OWNER_ID, {
      params: { giftListId: String(LIST_ID) },
      body: { feePreference: 'couple' },
    });
    const res = makeRes();
    await giftListController.updateGiftList(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    // The data branch must NOT have written feePreference somewhere else as a fallback.
    expect(giftListUpdate).not.toHaveBeenCalled();
  });
});
