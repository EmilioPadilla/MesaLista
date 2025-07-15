import apiClient from './client';

export interface User {
  id: number;
  email: string;
  name: string | null;
  phoneNumber?: string;
  weddingDate?: string;
  role?: 'COUPLE' | 'GUEST' | 'ADMIN';
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse extends User {
  token: string;
  message: string;
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
      console.log('Attempting login with:', { email });
      // Note: apiClient already has baseURL set to http://localhost:5001/api
      // so we don't need to include /api in the path
      const response = await apiClient.post<LoginResponse>('/login', { email, password });
      
      // Store the token in localStorage for future API calls
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  },
  
  logout: () => {
    // Remove the token from localStorage
    localStorage.removeItem('auth_token');
  },
  
  isAuthenticated: (): boolean => {
    return localStorage.getItem('auth_token') !== null;
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
  }
};

export default userService;

// Type for dashboard data that includes additional statistics
export interface DashboardUserData extends User {
  giftsCount?: number;
  totalAmount?: number;
}
