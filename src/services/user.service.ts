import apiClient, { CustomAxiosRequestConfig } from './client';
import { user_endpoints } from './endpoints';
import { User } from 'types/models/user';

export interface LoginResponse extends User {
  token: string;
  message: string;
  name: string;
}

export const userService = {
  getCurrentUser: async (suppressErrorLog = false): Promise<User> => {
    // Get the current user based on the stored token
    // The backend will identify the user from the token
    const response = await apiClient.get(user_endpoints.getCurrentUser, {
      suppressErrorLog,
    } as CustomAxiosRequestConfig & { suppressErrorLog?: boolean });
    return response.data;
  },
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get(user_endpoints.base);
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(user_endpoints.byId(id));
    return response.data;
  },

  getBySlug: async (slug: string): Promise<User> => {
    const response = await apiClient.get(user_endpoints.bySlug(slug), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Send credentials with cookies enabled
      const response = await apiClient.post<LoginResponse>(user_endpoints.login, { email, password }, { withCredentials: true });

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
      await apiClient.post(user_endpoints.logout, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> => {
    const response = await apiClient.post(user_endpoints.base, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(user_endpoints.byId(id));
  },

  checkSlugAvailability: async (slug: string, excludeUserId?: number): Promise<{ available: boolean; slug: string; message: string }> => {
    const params = excludeUserId ? { excludeUserId } : {};
    const response = await apiClient.get(user_endpoints.checkSlug(slug), {
      params,
      skipAuth: true,
    } as CustomAxiosRequestConfig);
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
    const response = await apiClient.put(user_endpoints.updateProfile, userData);
    return response.data;
  },

  updateCurrentUserPassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.put(user_endpoints.updatePassword, data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(user_endpoints.requestPasswordReset, { email }, { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email: string; firstName: string; error?: string }> => {
    const response = await apiClient.get(user_endpoints.verifyResetToken(token), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(user_endpoints.resetPassword, { token, newPassword }, {
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  deleteCurrentUser: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete(user_endpoints.deleteCurrentUser);
    return response.data;
  },

  updateUserPlanType: async (userId: number, planType: 'FIXED' | 'COMMISSION'): Promise<User> => {
    const response = await apiClient.put(user_endpoints.updatePlanType(userId), { planType });
    return response.data;
  },
};

export default userService;

// Type for dashboard data that includes additional statistics
export interface DashboardUserData extends User {
  giftsCount?: number;
  totalAmount?: number;
}
