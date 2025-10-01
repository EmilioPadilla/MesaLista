import { useMutation } from '@tanstack/react-query';
import emailService, { ResendEmailRequest, ResendEmailResponse } from '../services/email.service';

/**
 * Hook to resend payment confirmation emails
 * Sends both guest confirmation and owner notification emails
 */
export const useResendPaymentConfirmation = () => {
  return useMutation<ResendEmailResponse, Error, ResendEmailRequest>({
    mutationFn: (data: ResendEmailRequest) => emailService.resendPaymentConfirmation(data),
    onSuccess: (data) => {
      console.log('Payment confirmation emails resent successfully:', data);
    },
    onError: (error) => {
      console.error('Error resending payment confirmation emails:', error);
    },
  });
};
