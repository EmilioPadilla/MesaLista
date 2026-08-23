import apiClient, { CustomAxiosRequestConfig } from './client';
import { userEndpoints } from './user.endpoints';
import { User } from 'types/models/user';

export interface LoginResponse extends User {
  token: string;
  message: string;
  name: string;
}

export const userService = {
  /**
   * Free signup. Creates the couple and a draft list they can start building
   * immediately; no plan and no payment are involved. A discount code passed
   * here is attached to the draft and only redeemed when they publish.
   */
  signup: async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string; discountCode?: string; eventDate?: string },
  ): Promise<User & { giftListId: number; planType: string | null; publishedAt: string | null; token?: string }> => {
    const response = await apiClient.post(userEndpoints.signup, userData);
    return response.data;
  },

  /** @deprecated Legacy pre-publish signup, kept for App Store builds <= 1.0.2 (18). */
  signupCommission: async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string; discountCode?: string; eventDate?: string },
  ): Promise<User> => {
    const response = await apiClient.post(userEndpoints.signupCommission, userData);
    return response.data;
  },

  getCurrentUser: async (suppressErrorLog = false): Promise<User> => {
    // Get the current user based on the stored token
    // The backend will identify the user from the token
    const response = await apiClient.get(userEndpoints.getCurrentUser, {
      suppressErrorLog,
    } as CustomAxiosRequestConfig & { suppressErrorLog?: boolean });
    return response.data;
  },
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get(userEndpoints.base);
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(userEndpoints.byId(id));
    return response.data;
  },

  getBySlug: async (slug: string): Promise<User> => {
    const response = await apiClient.get(userEndpoints.bySlug(slug), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Send credentials with cookies enabled
      const response = await apiClient.post<LoginResponse>(userEndpoints.login, { email, password }, { withCredentials: true });

      // No need to store token - it's now in HttpOnly cookie
      // The backend handles session creation and cookie setting
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Call backend logout endpoint to invalidate session
      await apiClient.post(userEndpoints.logout, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> => {
    const response = await apiClient.post(userEndpoints.base, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(userEndpoints.byId(id));
  },

  checkSlugAvailability: async (slug: string, excludeUserId?: number): Promise<{ available: boolean; slug: string; message: string }> => {
    const params = excludeUserId ? { excludeUserId } : {};
    const response = await apiClient.get(userEndpoints.checkSlug(slug), {
      params,
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  /**
   * Signup-form check: is this email free? POSTed so the address never lands in a
   * URL or access log. Older deployed APIs 404 this route — callers treat that as
   * "unknown" and let the signup request itself catch the duplicate.
   */
  checkEmailAvailability: async (email: string): Promise<{ available: boolean; email: string }> => {
    const response = await apiClient.post(userEndpoints.checkEmail, { email }, { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  updateCurrentUserProfile: async (userData: {
    firstName?: string;
    lastName?: string;
    spouseFirstName?: string;
    spouseLastName?: string;
    phoneNumber?: string;
    slug?: string;
  }): Promise<User> => {
    const response = await apiClient.put(userEndpoints.updateProfile, userData);
    return response.data;
  },

  updateCurrentUserPassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.put(userEndpoints.updatePassword, data);
    return response.data;
  },

  /**
   * `source: 'app'` marks the request as coming from the mobile app so the emailed
   * link can tell the reset page to point the user back to the app when they finish.
   */
  requestPasswordReset: async (email: string, source?: 'app'): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      userEndpoints.requestPasswordReset,
      { email, source },
      { skipAuth: true } as CustomAxiosRequestConfig
    );
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email: string; firstName: string; error?: string }> => {
    const response = await apiClient.get(userEndpoints.verifyResetToken(token), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(userEndpoints.resetPassword, { token, newPassword }, {
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  deleteCurrentUser: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete(userEndpoints.deleteCurrentUser);
    return response.data;
  },

  updateUserPlanType: async (userId: number, planType: 'FIXED' | 'COMMISSION'): Promise<User> => {
    const response = await apiClient.put(userEndpoints.updatePlanType(userId), { planType });
    return response.data;
  },
};

export default userService;

// Type for dashboard data that includes additional statistics
export interface DashboardUserData extends User {
  giftsCount?: number;
  totalAmount?: number;
}
