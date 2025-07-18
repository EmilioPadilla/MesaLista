import apiClient from './client';

// Cart service types
export interface CartItem {
  id: number;
  giftId: number;
  giftName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for handling cart-related API calls
 */
export const cartService = {
  /**
   * Get the current user's cart
   * @returns Cart with items
   */
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  /**
   * Add an item to the cart
   * 
   * @param giftId ID of the gift to add
   * @param quantity Quantity to add
   * @returns Updated cart
   */
  addToCart: async ({ giftId, quantity = 1 }: { giftId: number; quantity?: number }): Promise<Cart> => {
    const response = await apiClient.post('/cart/items', { giftId, quantity });
    return response.data;
  },

  /**
   * Remove an item from the cart
   * 
   * @param cartItemId ID of the cart item to remove
   * @returns Updated cart
   */
  removeFromCart: async (cartItemId: number): Promise<Cart> => {
    const response = await apiClient.delete(`/cart/items/${cartItemId}`);
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
    const response = await apiClient.patch(`/cart/items/${cartItemId}`, { quantity });
    return response.data;
  },

  /**
   * Clear the cart
   * @returns Empty cart
   */
  clearCart: async (): Promise<Cart> => {
    const response = await apiClient.delete('/cart/items');
    return response.data;
  },
};

export default cartService;
