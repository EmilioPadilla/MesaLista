import prisma from '../lib/prisma.js';

export interface UserAnalytics {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  slug: string | null;
  phoneNumber: string | null;
  planType: 'FIXED' | 'COMMISSION' | null;
  discountCode: string | null;
  createdAt: Date;
  weddingList: {
    id: number;
    title: string;
    coupleName: string;
    weddingDate: Date;
    totalGifts: number;
    purchasedGifts: number;
    totalValue: number;
    totalReceived: number;
    purchaseRate: number;
    invitationCount: number;
  } | null;
}

export interface WeddingListAnalytics {
  id: number;
  title: string;
  coupleName: string;
  weddingDate: Date;
  createdAt: Date;
  coupleEmail: string;
  couplePlanType: 'FIXED' | 'COMMISSION' | null;
  slug: string | null;
  totalGifts: number;
  purchasedGifts: number;
  totalValue: number;
  totalReceived: number;
  purchaseRate: number;
  invitationCount: number;
  invitationsAccepted: number;
  invitationsRejected: number;
  invitationsPending: number;
  lastPurchaseDate: Date | null;
}

export interface UsersListsSummary {
  totalUsers: number;
  totalCouples: number;
  totalGuests: number;
  totalAdmins: number;
  fixedPlanUsers: number;
  commissionPlanUsers: number;
  totalWeddingLists: number;
  totalGiftsCreated: number;
  totalGiftsPurchased: number;
  totalRevenue: number;
  averageRevenuePerList: number;
  averageGiftsPerList: number;
  averagePurchaseRate: number;
}

class UsersListsAnalyticsService {
  /**
   * Get summary statistics for users and lists
   */
  async getSummary(from?: string, to?: string): Promise<UsersListsSummary> {
    const dateFilter =
      from && to
        ? {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {};

    // Get user counts by role
    const [totalUsers, usersByRole] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.user.groupBy({
        by: ['role'],
        where: dateFilter,
        _count: true,
      }),
    ]);

    const totalCouples = usersByRole.find((r: any) => r.role === 'COUPLE')?._count || 0;
    const totalGuests = usersByRole.find((r: any) => r.role === 'GUEST')?._count || 0;
    const totalAdmins = usersByRole.find((r: any) => r.role === 'ADMIN')?._count || 0;

    // Get gift list statistics to calculate plan types
    const giftLists = await prisma.giftList.findMany({
      where: dateFilter,
      include: {
        gifts: {
          select: {
            price: true,
            isPurchased: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    const totalWeddingLists = giftLists.length;
    const fixedPlanUsers = giftLists.filter((gl) => gl.planType === 'FIXED').length;
    const commissionPlanUsers = giftLists.filter((gl) => gl.planType === 'COMMISSION').length;
    let totalGiftsCreated = 0;
    let totalGiftsPurchased = 0;
    let totalRevenue = 0;

    giftLists.forEach((list) => {
      totalGiftsCreated += list.gifts.length;
      list.gifts.forEach((gift) => {
        if (gift.isPurchased) {
          totalGiftsPurchased++;
          totalRevenue += gift.price;
        }
      });
    });

    const averageRevenuePerList = totalWeddingLists > 0 ? totalRevenue / totalWeddingLists : 0;
    const averageGiftsPerList = totalWeddingLists > 0 ? totalGiftsCreated / totalWeddingLists : 0;
    const averagePurchaseRate = totalGiftsCreated > 0 ? (totalGiftsPurchased / totalGiftsCreated) * 100 : 0;

    return {
      totalUsers,
      totalCouples,
      totalGuests,
      totalAdmins,
      fixedPlanUsers,
      commissionPlanUsers,
      totalWeddingLists,
      totalGiftsCreated,
      totalGiftsPurchased,
      totalRevenue,
      averageRevenuePerList,
      averageGiftsPerList,
      averagePurchaseRate,
    };
  }

  /**
   * Get detailed analytics for all users with their wedding lists
   */
  async getUsersAnalytics(from?: string, to?: string): Promise<UserAnalytics[]> {
    const dateFilter =
      from && to
        ? {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {};

    const users = await prisma.user.findMany({
      where: {
        ...dateFilter,
        role: 'COUPLE', // Only get couples since they have gift lists
      },
      include: {
        giftLists: {
          include: {
            gifts: {
              select: {
                price: true,
                isPurchased: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => {
      let weddingListData = null;
      // Get the first gift list (users can have multiple now)
      const giftList = user.giftLists && user.giftLists.length > 0 ? user.giftLists[0] : null;

      if (giftList) {
        const totalGifts = giftList.gifts.length;
        const purchasedGifts = giftList.gifts.filter((g: any) => g.isPurchased).length;
        const totalValue = giftList.gifts.reduce((sum: number, g: any) => sum + g.price, 0);
        const totalReceived = giftList.gifts.filter((g: any) => g.isPurchased).reduce((sum: number, g: any) => sum + g.price, 0);
        const purchaseRate = totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0;

        weddingListData = {
          id: giftList.id,
          title: giftList.title,
          coupleName: giftList.coupleName,
          weddingDate: giftList.eventDate,
          totalGifts,
          purchasedGifts,
          totalValue,
          totalReceived,
          purchaseRate,
          invitationCount: giftList.invitationCount,
        };
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        spouseFirstName: user.spouseFirstName,
        spouseLastName: user.spouseLastName,
        slug: user.slug,
        phoneNumber: user.phoneNumber,
        planType: giftList?.planType as 'FIXED' | 'COMMISSION' | null,
        discountCode: giftList?.discountCodeId ? 'Applied' : null,
        createdAt: user.createdAt,
        weddingList: weddingListData,
      };
    });
  }

  /**
   * Get detailed analytics for all wedding lists
   */
  async getWeddingListsAnalytics(): Promise<WeddingListAnalytics[]> {
    const weddingLists = await prisma.giftList.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            slug: true,
          },
        },
        gifts: {
          select: {
            price: true,
            isPurchased: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch all invitees for all users at once
    const userIds = weddingLists.map((list) => list.user.id);
    const invitees = await prisma.invitee.findMany({
      where: {
        coupleId: {
          in: userIds,
        },
      },
      select: {
        coupleId: true,
        status: true,
      },
    });

    // Group invitees by coupleId
    const inviteesByCouple = invitees.reduce(
      (acc, invitee) => {
        if (!acc[invitee.coupleId]) {
          acc[invitee.coupleId] = [];
        }
        acc[invitee.coupleId].push(invitee);
        return acc;
      },
      {} as Record<number, typeof invitees>,
    );

    return weddingLists.map((list) => {
      const totalGifts = list.gifts.length;
      const purchasedGifts = list.gifts.filter((g: any) => g.isPurchased).length;
      const totalValue = list.gifts.reduce((sum: number, g: any) => sum + g.price, 0);
      const totalReceived = list.gifts.filter((g: any) => g.isPurchased).reduce((sum: number, g: any) => sum + g.price, 0);
      const purchaseRate = totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0;

      // Find the most recent purchase date
      const purchasedGiftDates = list.gifts.filter((g: any) => g.isPurchased).map((g: any) => g.updatedAt);
      const lastPurchaseDate =
        purchasedGiftDates.length > 0 ? new Date(Math.max(...purchasedGiftDates.map((d: any) => d.getTime()))) : null;

      // Get invitee statistics for this couple
      const coupleInvitees = inviteesByCouple[list.user.id] || [];
      const invitationCount = coupleInvitees.length;
      const invitationsAccepted = coupleInvitees.filter((inv) => inv.status === 'CONFIRMED').length;
      const invitationsRejected = coupleInvitees.filter((inv) => inv.status === 'REJECTED').length;
      const invitationsPending = coupleInvitees.filter((inv) => inv.status === 'PENDING').length;

      return {
        id: list.id,
        title: list.title,
        coupleName: list.coupleName,
        weddingDate: list.eventDate,
        createdAt: list.createdAt,
        coupleEmail: list.user.email,
        couplePlanType: list.planType as 'FIXED' | 'COMMISSION' | null,
        slug: list.user.slug,
        totalGifts,
        purchasedGifts,
        totalValue,
        totalReceived,
        purchaseRate,
        invitationCount,
        invitationsAccepted,
        invitationsRejected,
        invitationsPending,
        lastPurchaseDate,
      };
    });
  }
}

export default new UsersListsAnalyticsService();
