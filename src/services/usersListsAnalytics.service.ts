import apiClient from './client';
import { endpoints } from './endpoints';

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
  getSummary: async (): Promise<UsersListsSummary> => {
    const response = await apiClient.get<UsersListsSummary>(`${endpoints.usersListsAnalytics.summary}`);
    return response.data;
  },

  /**
   * Get detailed analytics for all users with their wedding lists
   */
  getUsersAnalytics: async (): Promise<UserAnalytics[]> => {
    const response = await apiClient.get<UserAnalytics[]>(`${endpoints.usersListsAnalytics.users}`);
    return response.data;
  },

  /**
   * Get detailed analytics for all wedding lists
   */
  getWeddingListsAnalytics: async (): Promise<WeddingListAnalytics[]> => {
    const response = await apiClient.get<WeddingListAnalytics[]>(`${endpoints.usersListsAnalytics.lists}`);
    return response.data;
  },
};

export default usersListsAnalyticsService;
