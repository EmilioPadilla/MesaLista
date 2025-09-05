import apiClient, { CustomAxiosRequestConfig } from './client';
import { user_endpoints } from './endpoints';
import { User } from 'types/models/user';

export interface LoginResponse extends User {
  token: string;
  message: string;
  name: string;
}

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    // Get the current user based on the stored token
    // The backend will identify the user from the token
    const response = await apiClient.get(user_endpoints.getCurrentUser);
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

  getBySlug: async (coupleSlug: string): Promise<User> => {
    const response = await apiClient.get(user_endpoints.bySlug(coupleSlug), { skipAuth: true } as CustomAxiosRequestConfig);
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
      // Continue with logout even if backend call fails
    }
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> => {
    const response = await apiClient.post(user_endpoints.base, userData);
    return response.data;
  },

  update: async (id: number, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> => {
    const response = await apiClient.put(user_endpoints.byId(id), userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(user_endpoints.byId(id));
  },
};

export default userService;

// Type for dashboard data that includes additional statistics
export interface DashboardUserData extends User {
  giftsCount?: number;
  totalAmount?: number;
}
