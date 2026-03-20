import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FIXED_PLAN_PRICE = 2000;

export interface GiftListPaymentAnalytics {
  id: number;
  title: string;
  coupleName: string;
  slug: string | null;
  coupleEmail: string;
  planType: 'FIXED' | 'COMMISSION' | null;
  feePreference: 'couple' | 'guest';
  discountCode: string | null;
  discountValue: number;
  createdAt: string;
  eventDate: string;
  totalGifts: number;
  purchasedGifts: number;
  grossPaypal: number;
  grossStripe: number;
  grossTotal: number;
}

export interface PaymentAnalyticsSummary {
  totalGiftLists: number;
  fixedPlanLists: number;
  commissionPlanLists: number;
  totalGrossPaypal: number;
  totalGrossStripe: number;
  totalGrossPayments: number;
  totalPaymentsCount: number;
  paypalPaymentsCount: number;
  stripePaymentsCount: number;
}

const paymentAnalyticsService = {
  /**
   * Get payment analytics for all gift lists
   */
  getGiftListsPaymentAnalytics: async (): Promise<GiftListPaymentAnalytics[]> => {
    const giftLists = await prisma.giftList.findMany({
      include: {
        user: {
          select: {
            email: true,
            slug: true,
          },
        },
        discountCode: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
        gifts: {
          select: {
            id: true,
            isPurchased: true,
          },
        },
        carts: {
          where: {
            status: 'PAID',
          },
          include: {
            payment: {
              select: {
                amount: true,
                paymentType: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return giftLists.map((list) => {
      const totalGifts = list.gifts.length;
      const purchasedGifts = list.gifts.filter((g: { isPurchased: boolean }) => g.isPurchased).length;

      const discountValue = list.discountCode
        ? list.discountCode.discountType === 'PERCENTAGE'
          ? (FIXED_PLAN_PRICE * list.discountCode.discountValue) / 100
          : list.discountCode.discountValue
        : 0;

      let grossPaypal = 0;
      let grossStripe = 0;

      for (const cart of list.carts) {
        if (cart.payment && cart.payment.status === 'PAID') {
          if (cart.payment.paymentType === 'PAYPAL') {
            grossPaypal += cart.payment.amount;
          } else if (cart.payment.paymentType === 'STRIPE') {
            grossStripe += cart.payment.amount;
          }
        }
      }

      return {
        id: list.id,
        title: list.title,
        coupleName: list.coupleName,
        slug: list.user.slug,
        coupleEmail: list.user.email,
        planType: list.planType as 'FIXED' | 'COMMISSION' | null,
        feePreference: list.feePreference as 'couple' | 'guest',
        discountCode: list.discountCode?.code || null,
        discountValue: Math.max(0, Math.min(FIXED_PLAN_PRICE, discountValue)),
        createdAt: list.createdAt.toISOString(),
        eventDate: list.eventDate.toISOString(),
        totalGifts,
        purchasedGifts,
        grossPaypal,
        grossStripe,
        grossTotal: grossPaypal + grossStripe,
      };
    });
  },

  /**
   * Get payment analytics summary
   */
  getPaymentAnalyticsSummary: async (): Promise<PaymentAnalyticsSummary> => {
    const giftLists = await prisma.giftList.findMany({
      select: {
        planType: true,
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
      },
      select: {
        amount: true,
        paymentType: true,
      },
    });

    const totalGiftLists = giftLists.length;
    const fixedPlanLists = giftLists.filter((l) => l.planType === 'FIXED').length;
    const commissionPlanLists = giftLists.filter((l) => l.planType === 'COMMISSION').length;

    let totalGrossPaypal = 0;
    let totalGrossStripe = 0;
    let paypalPaymentsCount = 0;
    let stripePaymentsCount = 0;

    for (const payment of payments) {
      if (payment.paymentType === 'PAYPAL') {
        totalGrossPaypal += payment.amount;
        paypalPaymentsCount++;
      } else if (payment.paymentType === 'STRIPE') {
        totalGrossStripe += payment.amount;
        stripePaymentsCount++;
      }
    }

    return {
      totalGiftLists,
      fixedPlanLists,
      commissionPlanLists,
      totalGrossPaypal,
      totalGrossStripe,
      totalGrossPayments: totalGrossPaypal + totalGrossStripe,
      totalPaymentsCount: payments.length,
      paypalPaymentsCount,
      stripePaymentsCount,
    };
  },
};

export default paymentAnalyticsService;
