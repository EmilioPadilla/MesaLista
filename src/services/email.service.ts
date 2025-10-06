import apiClient from './client';
import { endpoints } from './endpoints';

export interface ResendEmailRequest {
  cartId: string;
}

export interface ResendEmailResponse {
  success: boolean;
  message: string;
}

export interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}

const emailService = {
  /**
   * Resend payment confirmation emails to both admin and invitee
   * Sends both guest confirmation and owner notification emails
   */
  resendPaymentConfirmation: async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    const response = await apiClient.post<ResendEmailResponse>(endpoints.email.resendPaymentConfirmation, data);
    return response.data;
  },

  /**
   * Resend payment notification email to admin only
   * Sends only the owner notification email
   */
  resendPaymentToAdmin: async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    const response = await apiClient.post<ResendEmailResponse>(endpoints.email.resendPaymentToAdmin, data);
    return response.data;
  },

  /**
   * Resend payment confirmation email to invitee only
   * Sends only the guest confirmation email
   */
  resendPaymentToInvitee: async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    const response = await apiClient.post<ResendEmailResponse>(endpoints.email.resendPaymentToInvitee, data);
    return response.data;
  },

  /**
   * Send contact form email
   * Sends contact form submission to admin and auto-reply to user
   */
  sendContactForm: async (data: ContactFormRequest): Promise<ContactFormResponse> => {
    const response = await apiClient.post<ContactFormResponse>(endpoints.email.sendContactForm, data);
    return response.data;
  },
};

export default emailService;
