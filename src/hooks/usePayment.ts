import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';
import { queryKeys } from './queryKeys';

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
 * Hook to create Stripe checkout session
 */
export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: paymentService.createCheckoutSession,
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

/**
 * Hook to create PayPal order
 */
export const useCreatePayPalOrder = () => {
  return useMutation({
    mutationFn: paymentService.createPayPalOrder,
  });
};

/**
 * Hook to capture PayPal payment
 */
export const useCapturePayPalPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentService.capturePayPalPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.payments] });
    },
  });
};

/**
 * Hook to cancel a payment (Stripe or PayPal)
 */
export const useCancelPayment = () => {
  return useMutation({
    mutationFn: (data: { cartId: string; paymentMethod?: string }) => paymentService.cancelPayment(data),
  });
};

/**
 * Hook to create plan checkout session
 */
export const useCreatePlanCheckoutSession = () => {
  return useMutation({
    mutationFn: paymentService.createPlanCheckoutSession,
  });
};

/**
 * Hook to create gift list checkout session
 */
export const useCreateGiftListCheckoutSession = () => {
  return useMutation({
    mutationFn: paymentService.createGiftListCheckoutSession,
  });
};

/**
 * Hook to fetch purchased gifts by wedding list ID
 *
 * @param weddingListId ID of the wedding list
 * @param options React Query options
 */
export const usePurchasedGiftsByWeddingList = (weddingListId: number | undefined, options?: Partial<UseQueryOptions<any, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.purchasedGifts, weddingListId],
    queryFn: () => paymentService.getPurchasedGiftsByWeddingList(weddingListId!),
    enabled: !!weddingListId,
    ...options,
  });
};
