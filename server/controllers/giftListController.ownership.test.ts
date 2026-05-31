import { describe, it, expect, vi, beforeEach } from 'vitest';

// Parameterized ownership test for couple-owned mutations across giftListController
// and giftController. Per the review's self-critique (#6), this lives in ONE file
// rather than splitting one-per-endpoint — those decay together when the pattern
// changes. Every controller method that touches a couple-owned resource MUST embed
// the owner filter in the Prisma `where` so a non-owner gets count === 0 → 404
// without any extra round-trip.

const giftListFindUnique = vi.fn();
const giftListFindMany = vi.fn();
const giftListFindFirst = vi.fn();
const giftListCreate = vi.fn();
const giftListUpdateMany = vi.fn();
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
      findUnique: giftListFindUnique,
      findMany: giftListFindMany,
      findFirst: giftListFindFirst,
      create: giftListCreate,
      updateMany: giftListUpdateMany,
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
const { default: giftController } = await import('./giftController.js');

const OWNER_ID = 100;
const OTHER_USER_ID = 200;
const LIST_ID = 10;
const GIFT_ID = 5;

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

// Each row: [endpoint-name, controller-fn, owner-aware Prisma mock, request shape]
// The shared assertion: when invoked by a non-owner, the controller must respond 404
// AND the Prisma write/read MUST embed `userId` in the where clause.
type OwnerCase = {
  name: string;
  invoke: (req: any, res: any) => Promise<any>;
  mock: ReturnType<typeof vi.fn>;
  // Expected partial of `where` argument passed to Prisma
  expectedWhere: (userId: number) => any;
  // What the mock returns to simulate "not owned" (count: 0 or null)
  notOwnedReturn: any;
  // What the mock returns to simulate "owned" (count: 1 or row)
  ownedReturn: any;
  buildReq: (userId: number) => any;
};

const ownerCases: OwnerCase[] = [
  {
    name: 'updateGiftList (PUT /api/giftLists/:id)',
    invoke: giftListController.updateGiftList,
    mock: giftListUpdateMany,
    expectedWhere: (userId) => ({ id: LIST_ID, userId }),
    notOwnedReturn: { count: 0 },
    ownedReturn: { count: 1 },
    buildReq: (userId) =>
      reqAs(userId, {
        params: { giftListId: String(LIST_ID) },
        body: { title: 'Pwned' },
      }),
  },
  {
    name: 'deleteGiftList (DELETE /api/giftLists/:id)',
    invoke: giftListController.deleteGiftList,
    mock: giftListDeleteMany,
    expectedWhere: (userId) => ({ id: LIST_ID, userId }),
    notOwnedReturn: { count: 0 },
    ownedReturn: { count: 1 },
    buildReq: (userId) =>
      reqAs(userId, {
        params: { giftListId: String(LIST_ID) },
      }),
  },
  {
    name: 'deleteGift (DELETE /api/gifts/:id)',
    invoke: giftController.deleteGift,
    mock: giftDeleteMany,
    expectedWhere: (userId) => ({ id: GIFT_ID, giftList: { userId } }),
    notOwnedReturn: { count: 0 },
    ownedReturn: { count: 1 },
    buildReq: (userId) =>
      reqAs(userId, {
        params: { id: String(GIFT_ID) },
      }),
  },
  {
    name: 'updateGift (PUT /api/gifts/:id)',
    invoke: giftController.updateGift,
    mock: giftUpdateMany,
    expectedWhere: (userId) => ({ id: GIFT_ID, giftList: { userId } }),
    notOwnedReturn: { count: 0 },
    ownedReturn: { count: 1 },
    buildReq: (userId) =>
      reqAs(userId, {
        params: { id: String(GIFT_ID) },
        body: { title: 'Pwned', price: 100 },
      }),
  },
];

describe('ownership enforcement — couple-owned mutations', () => {
  describe.each(ownerCases)('$name', (c) => {
    it('returns 404 when the caller is NOT the owner (count === 0)', async () => {
      c.mock.mockResolvedValue(c.notOwnedReturn);

      const req = c.buildReq(OTHER_USER_ID);
      const res = makeRes();
      await c.invoke(req, res);

      // Owner filter must be embedded in the SQL where, not enforced via a pre-fetch.
      expect(c.mock).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining(c.expectedWhere(OTHER_USER_ID)) }),
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('allows the operation when the caller IS the owner (count === 1)', async () => {
      c.mock.mockResolvedValue(c.ownedReturn);
      // Some controllers re-fetch the row for the response payload.
      giftListFindUnique.mockResolvedValue({ id: LIST_ID, userId: OWNER_ID });
      giftFindUnique.mockResolvedValue({
        id: GIFT_ID,
        categories: [],
      });

      const req = c.buildReq(OWNER_ID);
      const res = makeRes();
      await c.invoke(req, res);

      expect(c.mock).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining(c.expectedWhere(OWNER_ID)) }),
      );
      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.status).not.toHaveBeenCalledWith(403);
    });
  });

  // Endpoints whose ownership pattern doesn't fit the table (different shape).

  describe('createGiftList (POST /api/giftLists)', () => {
    it('uses session userId, NOT the userId from the request body', async () => {
      // The pre-fix behaviour took userId straight from req.body, letting any
      // authenticated user create a list owned by anyone. Confirm we now ignore
      // body.userId and use req.user.userId.
      giftListCreate.mockResolvedValue({ id: LIST_ID });

      const req: any = reqAs(OWNER_ID, {
        body: {
          userId: OTHER_USER_ID, // attacker tries to spoof — must be ignored
          title: 'My List',
          coupleName: 'A & B',
          eventDate: '2026-12-01',
        },
      });
      const res = makeRes();
      await giftListController.createGiftList(req, res);

      expect(giftListCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: OWNER_ID }) }),
      );
      // and crucially NOT the spoofed body.userId
      expect(giftListCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: OTHER_USER_ID }) }),
      );
    });

    it('returns 401 if no session is attached', async () => {
      const req: any = {
        body: { title: 'My List', coupleName: 'A & B', eventDate: '2026-12-01' },
      };
      const res = makeRes();
      await giftListController.createGiftList(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(giftListCreate).not.toHaveBeenCalled();
    });
  });

  describe('getGiftListsByUser (GET /api/giftLists/user/:userId)', () => {
    it('forbids reading another user\'s lists even when authenticated', async () => {
      const req: any = reqAs(OWNER_ID, { params: { userId: String(OTHER_USER_ID) } });
      const res = makeRes();
      await giftListController.getGiftListsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(giftListFindMany).not.toHaveBeenCalled();
    });

    it('allows reading your own lists', async () => {
      giftListFindMany.mockResolvedValue([]);
      const req: any = reqAs(OWNER_ID, { params: { userId: String(OWNER_ID) } });
      const res = makeRes();
      await giftListController.getGiftListsByUser(req, res);
      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(giftListFindMany).toHaveBeenCalled();
    });
  });

  describe('createGift (POST /api/gifts)', () => {
    it('returns 404 when the target giftListId is not owned by the caller', async () => {
      giftListFindFirst.mockResolvedValue(null); // owner lookup returns nothing → not owned

      const req: any = reqAs(OTHER_USER_ID, {
        body: { title: 'Toaster', price: 500, giftListId: LIST_ID },
      });
      const res = makeRes();
      await giftController.createGift(req, res);

      expect(giftListFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: LIST_ID, userId: OTHER_USER_ID }) }),
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(giftCreate).not.toHaveBeenCalled();
    });

    it('allows creation when the giftListId IS owned', async () => {
      giftListFindFirst.mockResolvedValue({ id: LIST_ID });
      giftCreate.mockResolvedValue({ id: GIFT_ID, giftListId: LIST_ID });
      giftFindUnique.mockResolvedValue({ id: GIFT_ID, categories: [] });

      const req: any = reqAs(OWNER_ID, {
        body: { title: 'Toaster', price: 500, giftListId: LIST_ID },
      });
      const res = makeRes();
      await giftController.createGift(req, res);

      expect(giftCreate).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(404);
    });
  });

  describe('reorderGiftsInGiftList (PUT /api/giftLists/:id/reorder)', () => {
    it('returns 404 and skips the transaction when caller does not own the list', async () => {
      giftListFindFirst.mockResolvedValue(null);

      const req: any = reqAs(OTHER_USER_ID, {
        params: { giftListId: String(LIST_ID) },
        body: { giftOrders: [{ giftId: 1, order: 1 }] },
      });
      const res = makeRes();
      await giftListController.reorderGiftsInGiftList(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(transactionMock).not.toHaveBeenCalled();
    });
  });

  describe('updateGiftList — planType is immutable (#4)', () => {
    it('silently ignores planType in the request body', async () => {
      giftListUpdateMany.mockResolvedValue({ count: 1 });
      giftListFindUnique.mockResolvedValue({ id: LIST_ID, userId: OWNER_ID });

      const req: any = reqAs(OWNER_ID, {
        params: { giftListId: String(LIST_ID) },
        body: { title: 'Renamed', planType: 'COMMISSION' }, // attacker tries to downgrade
      });
      const res = makeRes();
      await giftListController.updateGiftList(req, res);

      // The data passed to Prisma must NOT include planType under any circumstance.
      const callArgs = giftListUpdateMany.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('planType');
      expect(callArgs.data.title).toBe('Renamed');
    });
  });
});
