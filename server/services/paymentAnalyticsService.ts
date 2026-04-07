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

export interface GiftPaymentDetail {
  giftId: number;
  giftTitle: string;
  giftPrice: number;
  paymentId: number;
  paymentType: 'PAYPAL' | 'STRIPE';
  paymentAmount: number;
  paymentFee: number;
  netAmount: number;
  mesaListaCommission: number;
  coupleReceives: number;
  guestName: string;
  guestEmail: string;
  paidAt: string;
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

  /**
   * Get detailed gift payments for a specific gift list
   */
  getGiftListPaymentDetails: async (giftListId: number): Promise<GiftPaymentDetail[]> => {
    const COMMISSION_RATE = 0.03;
    const PAYPAL_RATE = 0.0399;
    const PAYPAL_FIXED = 4.0;
    const STRIPE_RATE = 0.036;
    const STRIPE_FIXED = 3.0;

    const giftList = await prisma.giftList.findUnique({
      where: { id: giftListId },
      select: {
        planType: true,
        feePreference: true,
      },
    });

    if (!giftList) {
      return [];
    }

    const carts = await prisma.cart.findMany({
      where: {
        giftListId,
        status: 'PAID',
      },
      include: {
        payment: true,
        items: {
          include: {
            gift: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    const giftPayments: GiftPaymentDetail[] = [];

    for (const cart of carts) {
      if (!cart.payment || cart.payment.status !== 'PAID') continue;

      for (const item of cart.items) {
        if (!item.gift) continue;

        const giftPrice = item.gift.price * item.quantity;
        const paymentType = cart.payment.paymentType as 'PAYPAL' | 'STRIPE';

        // Calculate payment processing fee
        let paymentFee = 0;
        if (giftList.feePreference === 'couple') {
          // Couple absorbs fees - calculate from gross
          if (paymentType === 'PAYPAL') {
            paymentFee = giftPrice * PAYPAL_RATE + PAYPAL_FIXED;
          } else {
            paymentFee = giftPrice * STRIPE_RATE + STRIPE_FIXED;
          }
        }
        // If guest pays fees, the fee is already added to what they paid, so couple receives full amount

        const netAmount = giftPrice - paymentFee;

        // Calculate MesaLista commission (only for COMMISSION plan)
        let mesaListaCommission = 0;
        if (giftList.planType === 'COMMISSION') {
          mesaListaCommission = netAmount * COMMISSION_RATE;
        }

        const coupleReceives = netAmount - mesaListaCommission;

        giftPayments.push({
          giftId: item.gift.id,
          giftTitle: item.gift.title,
          giftPrice: item.gift.price,
          paymentId: cart.payment.id,
          paymentType,
          paymentAmount: giftPrice,
          paymentFee: Math.round(paymentFee * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          mesaListaCommission: Math.round(mesaListaCommission * 100) / 100,
          coupleReceives: Math.round(coupleReceives * 100) / 100,
          guestName: cart.inviteeName || 'Anónimo',
          guestEmail: cart.inviteeEmail || '',
          paidAt: cart.payment.createdAt.toISOString(),
        });
      }
    }

    return giftPayments;
  },
};

export default paymentAnalyticsService;
