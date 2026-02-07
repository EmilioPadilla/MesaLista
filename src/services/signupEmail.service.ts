import apiClient from './client';
import { endpoints } from './endpoints';

export interface SignupEmail {
  id: number;
  email: string;
  source: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  convertedToUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignupEmailsResponse {
  success: boolean;
  data: SignupEmail[];
}

export interface SignupEmailResponse {
  success: boolean;
  data: SignupEmail;
}

const signupEmailService = {
  /**
   * Save email from signup attempt (public)
   */
  saveFromSignup: async (data: { email: string; firstName?: string; lastName?: string; phone?: string }): Promise<SignupEmailResponse> => {
    const response = await apiClient.post<SignupEmailResponse>(endpoints.signupEmails.save, data);
    return response.data;
  },

  /**
   * Get all signup emails (admin only)
   */
  getAll: async (): Promise<SignupEmailsResponse> => {
    const response = await apiClient.get<SignupEmailsResponse>(endpoints.signupEmails.getAll);
    return response.data;
  },

  /**
   * Add email manually (admin only)
   */
  addManual: async (data: { email: string; firstName?: string; lastName?: string }): Promise<SignupEmailResponse> => {
    const response = await apiClient.post<SignupEmailResponse>(endpoints.signupEmails.addManual, data);
    return response.data;
  },

  /**
   * Delete a signup email (admin only)
   */
  deleteById: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(endpoints.signupEmails.delete(id));
    return response.data;
  },
};

export default signupEmailService;
