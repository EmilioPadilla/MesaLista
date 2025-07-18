import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';

// Define query keys
const queryKeys = {
  payments: 'payments',
  paymentSummary: 'paymentSummary',
};

/**
 * Hook to fetch all payments
 *
 * @param options React Query options
 */
export const usePayments = (options?: Partial<UseQueryOptions<any[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.payments],
    queryFn: () => paymentService.getAllPayments(),
    ...options,
  });
};

/**
 * Hook to fetch payment summary by ID
 *
 * @param paymentId ID of the payment
 * @param options React Query options
 */
export const usePaymentSummary = (paymentId: number | undefined, options?: Partial<UseQueryOptions<any, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.paymentSummary, paymentId],
    queryFn: () => paymentService.getPaymentSummary(paymentId!),
    enabled: !!paymentId,
    ...options,
  });
};

/**
 * Hook to initiate a payment
 */
export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: paymentService.initiatePayment,
  });
};

/**
 * Hook to verify a payment
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentService.verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.payments] });
    },
  });
};
