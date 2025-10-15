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

export interface SendVerificationCodeRequest {
  email: string;
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface CheckVerificationStatusResponse {
  verified: boolean;
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

  /**
   * Send verification code to email
   * Sends a 6-digit verification code to the provided email address
   */
  sendVerificationCode: async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
    const response = await apiClient.post<SendVerificationCodeResponse>(endpoints.emailVerification.sendCode, data);
    return response.data;
  },

  /**
   * Verify email with code
   * Verifies the provided code matches the one sent to the email
   */
  verifyCode: async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
    const response = await apiClient.post<VerifyCodeResponse>(endpoints.emailVerification.verifyCode, data);
    return response.data;
  },

  /**
   * Check if email was recently verified
   * Returns whether the email has been verified within the last 30 minutes
   */
  checkVerificationStatus: async (email: string): Promise<CheckVerificationStatusResponse> => {
    const response = await apiClient.get<CheckVerificationStatusResponse>(endpoints.emailVerification.checkStatus(email));
    return response.data;
  },
};

export default emailService;
