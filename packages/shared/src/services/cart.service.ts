import apiClient from './client';
import { cartEndpoints } from './cart.endpoints';
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
    const response = await apiClient.get(cartEndpoints.base, { params });
    return response.data;
  },

  /**
   * Add an item to the cart.
   *
   * For a group gift the guest states intent, not price: `shares` for a fixed
   * split, `amount` for an open goal. The server prices the line against the
   * money actually raised — a client-sent price is never trusted.
   *
   * @param giftId ID of the gift to add
   * @param quantity Quantity to add (single gifts)
   * @param sessionId Guest session ID
   * @param shares Number of equal shares claimed (GROUP_FIXED)
   * @param amount Amount to chip in (GROUP_OPEN)
   * @returns Updated cart
   */
  addToCart: async ({
    giftId,
    quantity = 1,
    sessionId,
    shares,
    amount,
  }: {
    giftId: number;
    quantity?: number;
    sessionId?: string;
    shares?: number;
    amount?: number;
  }): Promise<Cart> => {
    const response = await apiClient.post(cartEndpoints.addItem, { giftId, quantity, sessionId, shares, amount });
    return response.data;
  },

  /**
   * Remove an item from the cart
   *
   * @param cartItemId ID of the cart item to remove
   * @returns Updated cart
   */
  removeFromCart: async (cartItemId: number): Promise<Cart> => {
    const response = await apiClient.delete(cartEndpoints.byId(cartItemId));
    return response.data;
  },

  /**
   * Update cart item quantity
   *
   * @param cartItemId ID of the cart item
   * @param quantity New quantity
   * @returns Updated cart
   */
  updateCartItemQuantity: async ({
    cartItemId,
    quantity,
    amount,
  }: {
    cartItemId: number;
    quantity?: number;
    amount?: number;
  }): Promise<Cart> => {
    const response = await apiClient.patch(cartEndpoints.byId(cartItemId), { quantity, amount });
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
    const response = await apiClient.put(cartEndpoints.updateDetails(cartItemId), details);
    return response.data;
  },
};

export default cartService;
