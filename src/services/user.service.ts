import type { User } from '@prisma/client';
import apiClient from './client';

export interface LoginResponse extends User {
  token: string;
  message: string;
  name: string;
}

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    // Get the current user based on the stored token
    // The backend will identify the user from the token
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/users/login', { email, password });

      // Store the token in localStorage for future API calls
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);

        // Set token expiration time (24 hours from now)
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 24);
        localStorage.setItem('auth_token_expiration', expirationTime.toISOString());
      }

      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  },

  logout: () => {
    // Remove the token and expiration from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_expiration');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token');
    const expirationTimeStr = localStorage.getItem('auth_token_expiration');

    // If there's no token, user is not authenticated
    if (!token) return false;

    // Check if token has expired
    if (expirationTimeStr) {
      const expirationTime = new Date(expirationTimeStr);
      const currentTime = new Date();

      // If token has expired, logout the user and return false
      if (currentTime > expirationTime) {
        userService.logout();
        return false;
      }
    }

    return true;
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

export default userService;

// Type for dashboard data that includes additional statistics
export interface DashboardUserData extends User {
  giftsCount?: number;
  totalAmount?: number;
}
