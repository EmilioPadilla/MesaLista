import { describe, it, expect, vi, beforeEach } from 'vitest';

// Every admin "Recibido" has to equal the couple's "Monto Total Recibido", which adds up
// the lines of PAID payments. These gifts are the cases where `gift.price` on purchased
// gifts gives a different answer.

const cartItemFindMany = vi.fn();
const giftListFindMany = vi.fn();
const userFindMany = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  default: {
    cartItem: { findMany: cartItemFindMany },
    giftList: { findMany: giftListFindMany },
    user: {
      findMany: userFindMany,
      count: vi.fn().mockResolvedValue(1),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    invitee: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const { default: usersListsAnalyticsService } = await import('./usersListsAnalyticsService.js');

const LIST_ID = 1;

const list = {
  id: LIST_ID,
  title: 'Lista',
  coupleName: 'Ana y Luis',
  eventDate: new Date('2026-12-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  planType: 'FIXED',
  invitationCount: 0,
  discountCodeId: null,
  isActive: true,
  isPublic: true,
  user: { id: 1, email: 'ana@example.com', slug: 'ana-luis' },
  gifts: [
    // Price edited to $9,000 after a guest paid $1,000 for it.
    { price: 9000, isPurchased: true, updatedAt: new Date('2026-02-01T00:00:00Z') },
    // $500 raised so far toward a $3,000 goal.
    { price: 3000, isPurchased: false, updatedAt: new Date('2026-02-01T00:00:00Z') },
    // Bought in two units.
    { price: 200, isPurchased: true, updatedAt: new Date('2026-02-01T00:00:00Z') },
  ],
};

const paidLine = (price: number, quantity: number, giftListId = LIST_ID) => ({ price, quantity, gift: { giftListId } });

beforeEach(() => {
  vi.clearAllMocks();
  giftListFindMany.mockResolvedValue([list]);
  cartItemFindMany.mockResolvedValue([paidLine(1000, 1), paidLine(500, 1), paidLine(200, 2), paidLine(7777, 1, 2)]);
});

describe('admin received totals', () => {
  it('only counts lines of PAID payments', async () => {
    await usersListsAnalyticsService.getWeddingListsAnalytics();

    expect(cartItemFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { cart: { payment: { status: 'PAID' } } } }));
  });

  it('reports what was paid on the registries table', async () => {
    const [row] = await usersListsAnalyticsService.getWeddingListsAnalytics();

    expect(row.totalReceived).toBe(1900);
  });

  it('reports the same figure on the users table', async () => {
    userFindMany.mockResolvedValue([
      { id: 1, email: 'ana@example.com', firstName: 'Ana', lastName: 'Ruiz', createdAt: new Date(), giftLists: [list] },
    ]);

    const [row] = await usersListsAnalyticsService.getUsersAnalytics();

    expect(row.weddingList?.totalReceived).toBe(1900);
  });

  it("uses each user's oldest list so the row is stable", async () => {
    userFindMany.mockResolvedValue([]);

    await usersListsAnalyticsService.getUsersAnalytics();

    expect(userFindMany.mock.calls[0][0].include.giftLists.orderBy).toEqual({ createdAt: 'asc' });
  });

  it('builds summary revenue from the same lines, for the lists in scope only', async () => {
    const summary = await usersListsAnalyticsService.getSummary();

    expect(summary.totalRevenue).toBe(1900); // the other list's $7,777 is out of scope
    expect(summary.averageRevenuePerList).toBe(1900);
    expect(summary.totalGiftsPurchased).toBe(2);
  });
});
