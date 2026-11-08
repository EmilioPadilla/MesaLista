import { PrismaClient } from '@prisma/client';
import { lineTotal, lineUnitPrice, roundMoney } from '../lib/giftFunding.js';

const prisma = new PrismaClient();
const FIXED_PLAN_PRICE = 2000;
const COMMISSION_RATE = 0.03;
const PAYPAL_RATE = 0.0395;
const PAYPAL_FIXED = 4.0;
const STRIPE_RATE = 0.036;
const STRIPE_FIXED = 3.0;

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
  // Same figures as the per-list payment report, so the table can't drift from it.
  giftsTotal: number; // What the couple sees as "Monto Total Recibido"
  paymentFees: number;
  netPaypal: number;
  netStripe: number;
  netTotal: number;
  mesaListaCommission: number;
  coupleReceives: number; // "Total a Transferir"
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
  feeSource: 'reported' | 'estimated';
}

// Same line selection as the couple's purchased-gifts view: every line of a PAID payment.
const paidCartInclude = {
  payment: true,
  items: {
    include: {
      gift: {
        select: {
          id: true,
          title: true,
          price: true,
          giftListId: true,
        },
      },
    },
  },
};

/**
 * What one paid cart means for one gift list, line by line. Both the per-list report
 * and the all-lists table add these up, which is what keeps their totals identical.
 */
const buildGiftPaymentDetails = (
  cart: any,
  giftListId: number,
  giftList: { planType: string | null; feePreference: string },
): GiftPaymentDetail[] => {
  const paymentType = cart.payment.paymentType as 'PAYPAL' | 'STRIPE';
  // For carts that mix lists (shouldn't happen, but guard anyway) only count items
  // belonging to the gift list being reported on.
  const relevantItems = cart.items.filter((item: any) => item.gift?.giftListId === giftListId);
  // Price every line off the STORED line price, not gift.price. For a group gift
  // gift.price is the funding goal, so a $500 contribution toward a $3,000
  // honeymoon would otherwise be reported as $3,000 — and because cartGross
  // drives the fee proration below, one group line would skew the reported fee
  // and net of every OTHER line in the same cart too.
  const cartGross = cart.items.reduce((sum: number, item: any) => sum + lineTotal(item), 0);

  // Prefer the real fee reported by Stripe/PayPal at capture time.
  // Fall back to formula-based estimates for legacy payments captured before reconciliation was wired up.
  const reportedFee = cart.payment.feeSource === 'reported' ? cart.payment.transactionFee : null;
  const reportedNet = cart.payment.feeSource === 'reported' ? cart.payment.netAmount : null;

  return relevantItems.map((item: any) => {
    const giftPrice = lineTotal(item);
    const itemShare = cartGross > 0 ? giftPrice / cartGross : 0;

    let paymentFee = 0;
    let netAmount = giftPrice;
    let feeSource: 'reported' | 'estimated' = 'estimated';

    if (reportedFee !== null && reportedNet !== null) {
      // Prorate the real total fee across cart items by their share of the gross.
      // Whoever pays the fees, the real net is what actually came through from the processor.
      paymentFee = reportedFee * itemShare;
      netAmount = reportedNet * itemShare;
      feeSource = 'reported';
    } else {
      if (giftList.feePreference === 'couple') {
        if (paymentType === 'PAYPAL') {
          paymentFee = giftPrice * PAYPAL_RATE + PAYPAL_FIXED;
        } else {
          paymentFee = giftPrice * STRIPE_RATE + STRIPE_FIXED;
        }
      }
      netAmount = giftPrice - paymentFee;
    }

    // Calculate MesaLista commission (only for COMMISSION plan)
    let mesaListaCommission = 0;
    if (giftList.planType === 'COMMISSION') {
      mesaListaCommission = netAmount * COMMISSION_RATE;
    }

    const coupleReceives = netAmount - mesaListaCommission;

    return {
      giftId: item.gift.id,
      giftTitle: item.gift.title,
      giftPrice: lineUnitPrice(item),
      paymentId: cart.payment.id,
      paymentType,
      paymentAmount: giftPrice,
      paymentFee: roundMoney(paymentFee),
      netAmount: roundMoney(netAmount),
      mesaListaCommission: roundMoney(mesaListaCommission),
      coupleReceives: roundMoney(coupleReceives),
      guestName: cart.inviteeName || 'Anónimo',
      guestEmail: cart.inviteeEmail || '',
      paidAt: cart.payment.createdAt.toISOString(),
      feeSource,
    };
  });
};

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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Bucket payments by gift list via items.gift.giftListId rather than cart.giftListId.
    // cart.giftListId can be NULL on orphaned carts (e.g. emptied around a payment), which
    // would silently drop those payments from the report. Sourcing from gift.giftListId is
    // the truth.
    const paidCarts = await prisma.cart.findMany({
      where: { payment: { status: 'PAID' } },
      include: paidCartInclude,
    });

    const listsById = new Map<number, any>(giftLists.map((list: any) => [list.id, list]));
    const grossByList = new Map<number, { paypal: number; stripe: number }>();
    const reportByList = new Map<
      number,
      { gifts: number; fees: number; netPaypal: number; netStripe: number; commission: number; receives: number }
    >();

    for (const cart of paidCarts as any[]) {
      if (!cart.payment || cart.payment.status !== 'PAID') continue;
      // A cart's items can only belong to one gift list (enforced in addToCart),
      // so the first item with a giftListId determines the bucket.
      const listId = cart.items.find((it: any) => it.gift?.giftListId)?.gift?.giftListId;
      if (!listId) continue;
      const bucket = grossByList.get(listId) ?? { paypal: 0, stripe: 0 };
      if (cart.payment.paymentType === 'PAYPAL') bucket.paypal += cart.payment.amount;
      else if (cart.payment.paymentType === 'STRIPE') bucket.stripe += cart.payment.amount;
      grossByList.set(listId, bucket);

      const list = listsById.get(listId);
      if (!list) continue;
      const report = reportByList.get(listId) ?? { gifts: 0, fees: 0, netPaypal: 0, netStripe: 0, commission: 0, receives: 0 };
      for (const line of buildGiftPaymentDetails(cart, listId, list)) {
        report.gifts += line.paymentAmount;
        report.fees += line.paymentFee;
        if (line.paymentType === 'PAYPAL') report.netPaypal += line.netAmount;
        else report.netStripe += line.netAmount;
        report.commission += line.mesaListaCommission;
        report.receives += line.coupleReceives;
      }
      reportByList.set(listId, report);
    }

    return giftLists.map((list: any) => {
      const totalGifts = list.gifts.length;
      const purchasedGifts = list.gifts.filter((g: { isPurchased: boolean }) => g.isPurchased).length;

      const discountValue = list.discountCode
        ? list.discountCode.discountType === 'PERCENTAGE'
          ? (FIXED_PLAN_PRICE * list.discountCode.discountValue) / 100
          : list.discountCode.discountValue
        : 0;

      const gross = grossByList.get(list.id) ?? { paypal: 0, stripe: 0 };
      const report = reportByList.get(list.id) ?? { gifts: 0, fees: 0, netPaypal: 0, netStripe: 0, commission: 0, receives: 0 };

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
        grossPaypal: gross.paypal,
        grossStripe: gross.stripe,
        grossTotal: gross.paypal + gross.stripe,
        giftsTotal: roundMoney(report.gifts),
        paymentFees: roundMoney(report.fees),
        netPaypal: roundMoney(report.netPaypal),
        netStripe: roundMoney(report.netStripe),
        netTotal: roundMoney(report.netPaypal + report.netStripe),
        mesaListaCommission: roundMoney(report.commission),
        coupleReceives: roundMoney(report.receives),
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

    // Find every cart with a PAID payment and at least one item belonging to this gift list.
    // We deliberately do NOT filter by cart.giftListId — that field can be NULL when a
    // cart was emptied & refilled around a payment, even though the items themselves
    // still point to the gift list. Going through items.gift.giftListId is the source
    // of truth.
    const carts = await prisma.cart.findMany({
      where: {
        payment: { status: 'PAID' },
        items: {
          some: {
            gift: { giftListId },
          },
        },
      },
      include: paidCartInclude,
    });

    const giftPayments: GiftPaymentDetail[] = [];

    for (const cart of carts) {
      if (!cart.payment || cart.payment.status !== 'PAID') continue;

      giftPayments.push(...buildGiftPaymentDetails(cart, giftListId, giftList));
    }

    return giftPayments;
  },
};

export default paymentAnalyticsService;
