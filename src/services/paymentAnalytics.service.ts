import apiClient from './client';
import { endpoints } from './endpoints';

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
   * Get payment analytics summary
   */
  getSummary: async (): Promise<PaymentAnalyticsSummary> => {
    const response = await apiClient.get<PaymentAnalyticsSummary>(`${endpoints.paymentAnalytics.summary}`);
    return response.data;
  },

  /**
   * Get detailed payment analytics for all gift lists
   */
  getGiftListsPaymentAnalytics: async (): Promise<GiftListPaymentAnalytics[]> => {
    const response = await apiClient.get<GiftListPaymentAnalytics[]>(`${endpoints.paymentAnalytics.lists}`);
    return response.data;
  },
};

export default paymentAnalyticsService;
