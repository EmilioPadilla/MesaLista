import apiClient from './client';
import { endpoints } from './endpoints';

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
  createdAt: string;
  weddingList: {
    id: number;
    title: string;
    coupleName: string;
    weddingDate: string;
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
  weddingDate: string;
  createdAt: string;
  coupleEmail: string;
  couplePlanType: 'FIXED' | 'COMMISSION' | null;
  coupleSlug: string | null;
  totalGifts: number;
  purchasedGifts: number;
  totalValue: number;
  totalReceived: number;
  purchaseRate: number;
  invitationCount: number;
  lastPurchaseDate: string | null;
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

const usersListsAnalyticsService = {
  /**
   * Get summary statistics for users and wedding lists
   */
  getSummary: async (from?: string, to?: string): Promise<UsersListsSummary> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await apiClient.get<UsersListsSummary>(`${endpoints.usersListsAnalytics.summary}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed analytics for all users with their wedding lists
   */
  getUsersAnalytics: async (from?: string, to?: string): Promise<UserAnalytics[]> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await apiClient.get<UserAnalytics[]>(`${endpoints.usersListsAnalytics.users}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed analytics for all wedding lists
   */
  getWeddingListsAnalytics: async (from?: string, to?: string): Promise<WeddingListAnalytics[]> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await apiClient.get<WeddingListAnalytics[]>(`${endpoints.usersListsAnalytics.lists}?${params.toString()}`);
    return response.data;
  },
};

export default usersListsAnalyticsService;
