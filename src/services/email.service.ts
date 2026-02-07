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
  firstName?: string;
  lastName?: string;
  phone?: string;
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

export interface MarketingEmailResponse {
  success: boolean;
  message: string;
  data: {
    sent: number;
    failed: number;
  };
}

export interface CommissionUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  slug: string;
  createdAt: string;
  giftListCount: number;
  planType: string;
}

export interface CommissionUsersResponse {
  success: boolean;
  data: CommissionUser[];
}

export interface EmailPreviewResponse {
  success: boolean;
  data: {
    html: string;
    subject: string;
  };
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

  /**
   * Send Marketing Email 1 (Welcome) to users with specified plan types
   * Admin only - sends to users with specified plan types (defaults to COMMISSION)
   */
  sendMarketingEmail1: async (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<MarketingEmailResponse> => {
    const params = new URLSearchParams({ planTypes: planTypes.join(',') });
    const response = await apiClient.post<MarketingEmailResponse>(`${endpoints.email.sendMarketingEmail1}?${params}`);
    return response.data;
  },

  /**
   * Send Marketing Email 2 (Quick Start Guide) to users with specified plan types
   * Admin only - sends to users with specified plan types (defaults to COMMISSION)
   */
  sendMarketingEmail2: async (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<MarketingEmailResponse> => {
    const params = new URLSearchParams({ planTypes: planTypes.join(',') });
    const response = await apiClient.post<MarketingEmailResponse>(`${endpoints.email.sendMarketingEmail2}?${params}`);
    return response.data;
  },

  /**
   * Send Marketing Email 3 (Social Proof) to users with specified plan types
   * Admin only - sends to users with specified plan types (defaults to COMMISSION)
   */
  sendMarketingEmail3: async (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<MarketingEmailResponse> => {
    const params = new URLSearchParams({ planTypes: planTypes.join(',') });
    const response = await apiClient.post<MarketingEmailResponse>(`${endpoints.email.sendMarketingEmail3}?${params}`);
    return response.data;
  },

  /**
   * Send Marketing Email 4 (Re-engagement) to users with specified plan types
   * Admin only - sends to users with specified plan types (defaults to COMMISSION)
   */
  sendMarketingEmail4: async (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<MarketingEmailResponse> => {
    const params = new URLSearchParams({ planTypes: planTypes.join(',') });
    const response = await apiClient.post<MarketingEmailResponse>(`${endpoints.email.sendMarketingEmail4}?${params}`);
    return response.data;
  },

  /**
   * Get list of users with specified plan types
   * Admin only - returns users with specified plan types (defaults to COMMISSION)
   */
  getCommissionUsers: async (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<CommissionUsersResponse> => {
    const params = new URLSearchParams({ planTypes: planTypes.join(',') });
    const response = await apiClient.get<CommissionUsersResponse>(`${endpoints.email.getCommissionUsers}?${params}`);
    return response.data;
  },

  /**
   * Send marketing email to selected users
   * Admin only - sends email to specific user IDs
   */
  sendToSelectedUsers: async (emailType: 1 | 2 | 3 | 4, userIds: number[]): Promise<MarketingEmailResponse> => {
    const response = await apiClient.post<MarketingEmailResponse>(endpoints.email.sendToSelectedUsers, {
      emailType,
      userIds,
    });
    return response.data;
  },

  /**
   * Send marketing email to selected leads (signup emails)
   * Admin only - sends email to specific lead email addresses
   */
  sendToLeads: async (emailType: 1 | 2 | 3 | 4, leads: { email: string; firstName?: string | null }[]): Promise<MarketingEmailResponse> => {
    const response = await apiClient.post<MarketingEmailResponse>(endpoints.email.sendToLeads, {
      emailType,
      leads,
    });
    return response.data;
  },

  /**
   * Get marketing email preview
   * Admin only - returns HTML preview of email for specific user
   */
  getEmailPreview: async (emailType: 1 | 2 | 3 | 4, userId: number): Promise<EmailPreviewResponse> => {
    const response = await apiClient.get<EmailPreviewResponse>(endpoints.email.getEmailPreview(emailType, userId));
    return response.data;
  },
};

export default emailService;
