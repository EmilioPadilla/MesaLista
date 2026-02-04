import { useMutation, useQuery } from '@tanstack/react-query';
import emailService, {
  ResendEmailRequest,
  ResendEmailResponse,
  ContactFormRequest,
  ContactFormResponse,
  MarketingEmailResponse,
  CommissionUsersResponse,
  EmailPreviewResponse,
} from '../services/email.service';

/**
 * Hook to resend payment confirmation emails to both admin and invitee
 * Sends both guest confirmation and owner notification emails
 */
export const useResendPaymentConfirmation = () => {
  return useMutation<ResendEmailResponse, Error, ResendEmailRequest>({
    mutationFn: (data: ResendEmailRequest) => emailService.resendPaymentConfirmation(data),
  });
};

/**
 * Hook to resend payment notification email to admin only
 * Sends only the owner notification email
 */
export const useResendPaymentToAdmin = () => {
  return useMutation<ResendEmailResponse, Error, ResendEmailRequest>({
    mutationFn: (data: ResendEmailRequest) => emailService.resendPaymentToAdmin(data),
  });
};

/**
 * Hook to resend payment confirmation email to invitee only
 * Sends only the guest confirmation email
 */
export const useResendPaymentToInvitee = () => {
  return useMutation<ResendEmailResponse, Error, ResendEmailRequest>({
    mutationFn: (data: ResendEmailRequest) => emailService.resendPaymentToInvitee(data),
  });
};

/**
 * Hook to send contact form email
 * Sends contact form submission to admin and auto-reply to user
 */
export const useSendContactForm = () => {
  return useMutation<ContactFormResponse, Error, ContactFormRequest>({
    mutationFn: (data: ContactFormRequest) => emailService.sendContactForm(data),
  });
};

/**
 * Hook to send Marketing Email 1 (Welcome) to users with specified plan types
 * Admin only
 */
export const useSendMarketingEmail1 = () => {
  return useMutation<MarketingEmailResponse, Error, ('COMMISSION' | 'FIXED')[]>({
    mutationFn: (planTypes = ['COMMISSION']) => emailService.sendMarketingEmail1(planTypes),
  });
};

/**
 * Hook to send Marketing Email 2 (Quick Start Guide) to users with specified plan types
 * Admin only
 */
export const useSendMarketingEmail2 = () => {
  return useMutation<MarketingEmailResponse, Error, ('COMMISSION' | 'FIXED')[]>({
    mutationFn: (planTypes = ['COMMISSION']) => emailService.sendMarketingEmail2(planTypes),
  });
};

/**
 * Hook to send Marketing Email 3 (Social Proof) to users with specified plan types
 * Admin only
 */
export const useSendMarketingEmail3 = () => {
  return useMutation<MarketingEmailResponse, Error, ('COMMISSION' | 'FIXED')[]>({
    mutationFn: (planTypes = ['COMMISSION']) => emailService.sendMarketingEmail3(planTypes),
  });
};

/**
 * Hook to send Marketing Email 4 (Re-engagement) to users with specified plan types
 * Admin only
 */
export const useSendMarketingEmail4 = () => {
  return useMutation<MarketingEmailResponse, Error, ('COMMISSION' | 'FIXED')[]>({
    mutationFn: (planTypes = ['COMMISSION']) => emailService.sendMarketingEmail4(planTypes),
  });
};

/**
 * Hook to get list of users with specified plan types
 * Admin only
 */
export const useCommissionUsers = (planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']) => {
  return useQuery<CommissionUsersResponse, Error>({
    queryKey: ['commissionUsers', planTypes],
    queryFn: () => emailService.getCommissionUsers(planTypes),
  });
};

/**
 * Hook to send marketing email to selected users
 * Admin only
 */
export const useSendToSelectedUsers = () => {
  return useMutation<MarketingEmailResponse, Error, { emailType: 1 | 2 | 3 | 4; userIds: number[] }>({
    mutationFn: ({ emailType, userIds }) => emailService.sendToSelectedUsers(emailType, userIds),
  });
};

/**
 * Hook to get marketing email preview
 * Admin only
 */
export const useEmailPreview = (emailType: 1 | 2 | 3 | 4, userId: number, enabled: boolean = false) => {
  return useQuery<EmailPreviewResponse, Error>({
    queryKey: ['emailPreview', emailType, userId],
    queryFn: () => emailService.getEmailPreview(emailType, userId),
    enabled,
  });
};
