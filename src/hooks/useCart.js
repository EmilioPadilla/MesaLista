import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { queryKeys } from './queryKeys';
/**
 * Hook to fetch the current user's cart
 *
 * @param options React Query options
 */
export const useCart = (options) => {
    return useQuery({
        queryKey: [queryKeys.cart],
        queryFn: () => cartService.getCart(),
        ...options,
    });
};
/**
 * Hook to add an item to the cart
 */
export const useAddToCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cartService.addToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
            queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
        },
    });
};
/**
 * Hook to remove an item from the cart
 */
export const useRemoveFromCart = () => {
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
 * Hook to clear the cart
 */
export const useClearCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cartService.clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKeys.cart] });
            queryClient.invalidateQueries({ queryKey: [queryKeys.cartItems] });
        },
    });
};
