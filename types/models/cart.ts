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
  giftListId?: number;
  inviteeName?: string;
  inviteeEmail?: string;
  country?: string;
  phoneNumber?: string;
  message?: string;
  rsvpCode?: string;
  paymentId?: string;
  status: CartStatus;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  items?: CartItem[];
}

/**
 * Add to cart request payload.
 *
 * Which field the guest sends depends on how the gift is funded:
 *   SINGLE      — `quantity`, the number of units, as always.
 *   GROUP_FIXED — `shares`, how many of the equal shares this guest is covering.
 *   GROUP_OPEN  — `amount`, the sum this guest chose to chip in.
 * The server derives the stored line (price × quantity) from these; it never
 * trusts a client-sent price.
 */
export interface AddToCartRequest {
  giftId: number;
  quantity?: number;
  sessionId?: string;
  /** GROUP_FIXED only: number of equal shares this guest claims. Defaults to 1. */
  shares?: number;
  /** GROUP_OPEN only: the amount, in MXN, this guest is chipping in. */
  amount?: number;
}

/**
 * Update cart item request payload. `quantity` means units for SINGLE gifts and
 * shares for GROUP_FIXED; `amount` re-sets an open-ended contribution.
 */
export interface UpdateCartItemRequest {
  quantity?: number;
  amount?: number;
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
  sessionId: string;
  inviteeName?: string;
  inviteeEmail?: string;
  country?: string;
  phoneNumber?: string;
  message?: string;
  rsvpCode?: string;
}
