import prisma from '../lib/prisma.js';

export interface UserAnalytics {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  coupleSlug: string | null;
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
  coupleSlug: string | null;
  totalGifts: number;
  purchasedGifts: number;
  totalValue: number;
  totalReceived: number;
  purchaseRate: number;
  invitationCount: number;
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
    const [totalUsers, usersByRole, usersByPlan] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.user.groupBy({
        by: ['role'],
        where: dateFilter,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['planType'],
        where: {
          ...dateFilter,
          role: 'COUPLE',
        },
        _count: true,
      }),
    ]);

    const totalCouples = usersByRole.find((r) => r.role === 'COUPLE')?._count || 0;
    const totalGuests = usersByRole.find((r) => r.role === 'GUEST')?._count || 0;
    const totalAdmins = usersByRole.find((r) => r.role === 'ADMIN')?._count || 0;
    const fixedPlanUsers = usersByPlan.find((p) => p.planType === 'FIXED')?._count || 0;
    const commissionPlanUsers = usersByPlan.find((p) => p.planType === 'COMMISSION')?._count || 0;

    // Get wedding list statistics
    const weddingLists = await prisma.weddingList.findMany({
      where: dateFilter,
      include: {
        gifts: {
          select: {
            price: true,
            isPurchased: true,
          },
        },
        couple: {
          select: {
            id: true,
          },
        },
      },
    });

    const totalWeddingLists = weddingLists.length;
    let totalGiftsCreated = 0;
    let totalGiftsPurchased = 0;
    let totalRevenue = 0;

    weddingLists.forEach((list) => {
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
        role: 'COUPLE', // Only get couples since they have wedding lists
      },
      include: {
        weddingList: {
          include: {
            gifts: {
              select: {
                price: true,
                isPurchased: true,
              },
            },
          },
        },
        discountCode: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => {
      let weddingListData = null;

      if (user.weddingList) {
        const totalGifts = user.weddingList.gifts.length;
        const purchasedGifts = user.weddingList.gifts.filter((g) => g.isPurchased).length;
        const totalValue = user.weddingList.gifts.reduce((sum, g) => sum + g.price, 0);
        const totalReceived = user.weddingList.gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0);
        const purchaseRate = totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0;

        weddingListData = {
          id: user.weddingList.id,
          title: user.weddingList.title,
          coupleName: user.weddingList.coupleName,
          weddingDate: user.weddingList.weddingDate,
          totalGifts,
          purchasedGifts,
          totalValue,
          totalReceived,
          purchaseRate,
          invitationCount: user.weddingList.invitationCount,
        };
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        spouseFirstName: user.spouseFirstName,
        spouseLastName: user.spouseLastName,
        coupleSlug: user.coupleSlug,
        phoneNumber: user.phoneNumber,
        planType: user.planType as 'FIXED' | 'COMMISSION' | null,
        discountCode: user.discountCode?.code || null,
        createdAt: user.createdAt,
        weddingList: weddingListData,
      };
    });
  }

  /**
   * Get detailed analytics for all wedding lists
   */
  async getWeddingListsAnalytics(from?: string, to?: string): Promise<WeddingListAnalytics[]> {
    const dateFilter =
      from && to
        ? {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {};

    const weddingLists = await prisma.weddingList.findMany({
      where: dateFilter,
      include: {
        couple: {
          select: {
            email: true,
            planType: true,
            coupleSlug: true,
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

    return weddingLists.map((list) => {
      const totalGifts = list.gifts.length;
      const purchasedGifts = list.gifts.filter((g) => g.isPurchased).length;
      const totalValue = list.gifts.reduce((sum, g) => sum + g.price, 0);
      const totalReceived = list.gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0);
      const purchaseRate = totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0;

      // Find the most recent purchase date
      const purchasedGiftDates = list.gifts.filter((g) => g.isPurchased).map((g) => g.updatedAt);
      const lastPurchaseDate = purchasedGiftDates.length > 0 ? new Date(Math.max(...purchasedGiftDates.map((d) => d.getTime()))) : null;

      return {
        id: list.id,
        title: list.title,
        coupleName: list.coupleName,
        weddingDate: list.weddingDate,
        createdAt: list.createdAt,
        coupleEmail: list.couple.email,
        couplePlanType: list.couple.planType as 'FIXED' | 'COMMISSION' | null,
        coupleSlug: list.couple.coupleSlug,
        totalGifts,
        purchasedGifts,
        totalValue,
        totalReceived,
        purchaseRate,
        invitationCount: list.invitationCount,
        lastPurchaseDate,
      };
    });
  }
}

export default new UsersListsAnalyticsService();
