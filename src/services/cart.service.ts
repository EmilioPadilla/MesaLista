import apiClient from './client';
import { cart_endpoints } from './endpoints';
import type { CartDetailsRequest } from 'types/api/cart';
import type { Cart } from 'types/models/cart';

/**
 * Service for handling cart-related API calls
 */
export const cartService = {
  /**
   * Get the current user's cart
   * @param sessionId Guest session ID
   * @returns Cart with items
   */
  getCart: async (sessionId?: string): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await apiClient.get(cart_endpoints.base, { params });
    return response.data;
  },

  /**
   * Add an item to the cart
   *
   * @param giftId ID of the gift to add
   * @param quantity Quantity to add
   * @param sessionId Guest session ID
   * @returns Updated cart
   */
  addToCart: async ({ giftId, quantity = 1, sessionId }: { giftId: number; quantity?: number; sessionId?: string }): Promise<Cart> => {
    const response = await apiClient.post(cart_endpoints.addItem, { giftId, quantity, sessionId });
    return response.data;
  },

  /**
   * Remove an item from the cart
   *
   * @param cartItemId ID of the cart item to remove
   * @returns Updated cart
   */
  removeFromCart: async (cartItemId: number): Promise<Cart> => {
    const response = await apiClient.delete(cart_endpoints.byId(cartItemId));
    return response.data;
  },

  /**
   * Update cart item quantity
   *
   * @param cartItemId ID of the cart item
   * @param quantity New quantity
   * @returns Updated cart
   */
  updateCartItemQuantity: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }): Promise<Cart> => {
    const response = await apiClient.patch(cart_endpoints.byId(cartItemId), { quantity });
    return response.data;
  },

  /**
   * Update Cart Details
   *
   * @param cartItemId ID of the cart item
   * @param details New details
   * @returns Updated cart
   */
  updateCartDetails: async (cartItemId: number, details: CartDetailsRequest): Promise<Cart> => {
    const response = await apiClient.put(cart_endpoints.updateDetails(cartItemId), details);
    return response.data;
  },

  /**
   * Checkout cart
   *
   * @param cartItemId ID of the cart item
   * @returns Updated cart
   */
  checkoutCart: async (cartItemId: number): Promise<Cart> => {
    const response = await apiClient.post(cart_endpoints.checkout(cartItemId));
    return response.data;
  },
};

export default cartService;
