import apiClient from './client';
import { endpoints } from './endpoints';

export interface ResendEmailRequest {
  cartId: string;
}

export interface ResendEmailResponse {
  success: boolean;
  message: string;
}

const emailService = {
  /**
   * Resend payment confirmation emails
   * Sends both guest confirmation and owner notification emails
   */
  resendPaymentConfirmation: async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    const response = await apiClient.post<ResendEmailResponse>(endpoints.email.resendPaymentConfirmation, data);
    return response.data;
  },
};

export default emailService;
