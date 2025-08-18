import { Gift } from 'types/models/gift.js';

/**
 * Cart status enum
 */
export enum CartStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Cart item interface
 */
export interface CartItem {
  id: number;
  cartId: number;
  giftId: number;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  gift?: Gift;
}

/**
 * Cart interface
 */
export interface Cart {
  id: number;
  sessionId: string;
  inviteeName?: string;
  inviteeEmail?: string;
  country?: string;
  phoneNumber?: string;
  message?: string;
  paymentId?: string;
  status: CartStatus;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  items?: CartItem[];
}

/**
 * Add to cart request payload
 */
export interface AddToCartRequest {
  giftId: number;
  quantity?: number;
  sessionId?: string;
}

/**
 * Update cart item request payload
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Remove from cart request payload
 */
export interface RemoveFromCartRequest {
  cartItemId: number;
}

/**
 * Update cart details request payload
 */
export interface UpdateCartDetailsRequest {
  inviteeName?: string;
  inviteeEmail?: string;
  country?: string;
  phoneNumber?: string;
  message?: string;
}

/**
 * Checkout cart response
 */
export interface CheckoutCartResponse {
  success: boolean;
  purchaseIds?: number[];
  message: string;
}
