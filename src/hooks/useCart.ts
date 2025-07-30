import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { queryKeys } from './queryKeys';
import type { CartItem } from 'types/models/cart';

/**
 * Hook to fetch the current user's cart
 *
 * @param sessionId Guest session ID
 * @param options React Query options
 */
export const useGetCart = (sessionId?: string, options?: Partial<UseQueryOptions<any, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.cart, sessionId],
    queryFn: () => cartService.getCart(sessionId),
    enabled: !!sessionId, // Only run query if sessionId is provided
    ...options,
  });
};

/**
 * Hook to add an item to the cart
 */
export const useAddGiftToCart = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartService.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cart, sessionId] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
    },
  });
};

/**
 * Hook to remove an item from the cart
 */
export const useRemoveGiftFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
    },
  });
};

/**
 * Hook to update cart item quantity
 */
export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartService.updateCartItemQuantity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
    },
  });
};

/**
 * Hook to update cart details
 */
export const useUpdateCartDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, details }: { cartItemId: number; details: CartItem }) => 
      cartService.updateCartDetails(cartItemId, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
    },
  });
};

/**
 * Hook to checkout cart
 */
export const useCheckoutCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartService.checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
    },
  });
};
