import { useMutation } from '@tanstack/react-query';
import emailService, { ResendEmailRequest, ResendEmailResponse, ContactFormRequest, ContactFormResponse } from '../services/email.service';

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
