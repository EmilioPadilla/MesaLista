import { useMutation, useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import emailService, {
  ResendEmailRequest,
  ResendEmailResponse,
  ContactFormRequest,
  ContactFormResponse,
  MarketingEmailResponse,
  CommissionUsersResponse,
  EmailPreviewResponse,
} from '../services/email.service';
import { MarketingEmailType } from 'src/config/marketingEmailTemplates';

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
  return useMutation<MarketingEmailResponse, Error, { emailType: MarketingEmailType; userIds: number[] }>({
    mutationFn: ({ emailType, userIds }) => emailService.sendToSelectedUsers(emailType, userIds),
  });
};

/**
 * Hook to send marketing email to selected leads (signup emails)
 * Admin only
 */
export const useSendToLeads = () => {
  return useMutation<
    MarketingEmailResponse,
    Error,
    { emailType: MarketingEmailType; leads: { email: string; firstName?: string | null }[] }
  >({
    mutationFn: ({ emailType, leads }) => emailService.sendToLeads(emailType, leads),
  });
};

/**
 * Hook to get marketing email preview
 * Admin only
 */
export const useEmailPreview = (emailType: MarketingEmailType, userId: number, enabled: boolean = false) => {
  return useQuery<EmailPreviewResponse, Error>({
    queryKey: ['emailPreview', emailType, userId],
    queryFn: () => emailService.getEmailPreview(emailType, userId),
    enabled,
  });
};

/**
 * Hook to send marketing email to a specific user
 * Admin only
 */
export const useSendMarketingEmailToUser = () => {
  return useMutation<ResendEmailResponse, Error, { userId: number; emailType: MarketingEmailType }>({
    mutationFn: ({ userId, emailType }) => emailService.sendMarketingEmailToUser(userId, emailType),
    onSuccess: () => {
      message.success('Email de marketing enviado exitosamente');
    },
    onError: (error) => {
      message.error(error.message || 'Error al enviar email de marketing');
    },
  });
};
