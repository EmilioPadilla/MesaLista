import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S7 — drafts are invisible to guests and visible to their owner.
// Successor to the old commissionListVisibility test: hiding is now driven by
// `publishedAt`, not by the plan.

const giftListFindMany = vi.fn();
const giftListFindFirst = vi.fn();
const giftListFindUnique = vi.fn();
const giftFindMany = vi.fn();
const userFindUnique = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    giftList = { findMany: giftListFindMany, findFirst: giftListFindFirst, findUnique: giftListFindUnique, create: vi.fn() };
    gift = { findMany: giftFindMany };
    user = { findUnique: userFindUnique };
    giftCategoryOnGift = { findMany: vi.fn().mockResolvedValue([]) };
  },
}));

vi.mock('../services/giftListPublishService.js', () => ({ publishGiftList: vi.fn() }));

const { default: giftListController } = await import('./giftListController.js');

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const publishedList = {
  id: 10,
  userId: 1,
  coupleName: 'Maria y Juan',
  eventDate: new Date('2026-12-01'),
  publishedAt: new Date('2026-08-01'),
  isActive: true,
  gifts: [],
  user: { slug: 'maria-y-juan' },
};

const draftList = { ...publishedList, id: 11, publishedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  giftListFindMany.mockResolvedValue([]);
  userFindUnique.mockResolvedValue({ id: 1 });
});

describe('search listing', () => {
  it('excludes drafts even if isPublic somehow got set', async () => {
    const res = makeRes();
    await giftListController.getAllGiftLists({} as any, res as any);

    // The query itself must filter — relying on isPublic alone is what let an
    // unpublished list surface in search.
    expect(giftListFindMany.mock.calls[0][0].where).toEqual({
      isPublic: true,
      publishedAt: { not: null },
    });
  });
});

describe('GET /giftLists/:id', () => {
  it('404s a draft for an anonymous guest', async () => {
    giftListFindUnique.mockResolvedValue(draftList);

    const res = makeRes();
    await giftListController.getGiftListById({ params: { giftListId: '11' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('404s a draft for a signed-in stranger', async () => {
    giftListFindUnique.mockResolvedValue(draftList);

    const res = makeRes();
    await giftListController.getGiftListById({ params: { giftListId: '11' }, user: { userId: 999 } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns a draft to its owner so they can preview it', async () => {
    giftListFindUnique.mockResolvedValue(draftList);

    const res = makeRes();
    await giftListController.getGiftListById({ params: { giftListId: '11' }, user: { userId: 1 } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns a published list to anyone', async () => {
    giftListFindUnique.mockResolvedValue(publishedList);

    const res = makeRes();
    await giftListController.getGiftListById({ params: { giftListId: '10' } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(404);
  });
});

describe('GET /giftLists/by-slug/:slug', () => {
  it('filters out drafts for guests', async () => {
    giftListFindFirst.mockResolvedValue(null);

    const res = makeRes();
    await giftListController.getFirstGiftListByUserSlug({ params: { slug: 'maria-y-juan' } } as any, res as any);

    expect(giftListFindFirst.mock.calls[0][0].where).toEqual({
      userId: 1,
      publishedAt: { not: null },
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('does not filter for the owner', async () => {
    giftListFindFirst.mockResolvedValue(draftList);

    const res = makeRes();
    await giftListController.getFirstGiftListByUserSlug(
      { params: { slug: 'maria-y-juan' }, user: { userId: 1 } } as any,
      res as any,
    );

    expect(giftListFindFirst.mock.calls[0][0].where).toEqual({ userId: 1 });
  });
});

describe('gifts and categories', () => {
  it('404s the gifts of a draft for a guest', async () => {
    giftListFindUnique.mockResolvedValue({ publishedAt: null, userId: 1 });

    const res = makeRes();
    await giftListController.getGiftsByGiftList({ params: { giftListId: '11' }, query: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(giftFindMany).not.toHaveBeenCalled();
  });

  it('404s the categories of a draft for a guest', async () => {
    giftListFindUnique.mockResolvedValue({ publishedAt: null, userId: 1 });

    const res = makeRes();
    await giftListController.getCategoriesInGiftList({ params: { giftListId: '11' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('serves the gifts of a draft to its owner', async () => {
    giftListFindUnique.mockResolvedValue({ publishedAt: null, userId: 1 });
    giftFindMany.mockResolvedValue([]);

    const res = makeRes();
    await giftListController.getGiftsByGiftList({ params: { giftListId: '11' }, query: {}, user: { userId: 1 } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(giftFindMany).toHaveBeenCalled();
  });
});
