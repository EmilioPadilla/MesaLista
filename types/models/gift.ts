import type { WeddingList } from './weddingList.js';
import type { CartItem } from './cart.js';

/**
 * How a gift gets funded.
 *
 *   SINGLE      — one guest buys it outright. The original behaviour, and the
 *                 default, so untouched gifts keep working exactly as before.
 *   GROUP_FIXED — the couple splits it into a fixed number of equal shares
 *                 (e.g. 3 friends split one gift); a share costs
 *                 `price / contributorTarget`.
 *   GROUP_OPEN  — any number of guests chip in any amount until `price` (the
 *                 goal) is reached.
 */
export type GiftType = 'SINGLE' | 'GROUP_FIXED' | 'GROUP_OPEN';

export const GIFT_TYPES: readonly GiftType[] = ['SINGLE', 'GROUP_FIXED', 'GROUP_OPEN'] as const;

export interface Gift {
  id: number;
  title: string;
  description?: string | null;
  /**
   * Unit price for SINGLE gifts; the funding GOAL for both group variants.
   * One number, so price sorting/filtering and the couple's totals stay honest.
   */
  price: number;
  giftType: GiftType;
  /** GROUP_FIXED only: how many equal shares the gift is split into. */
  contributorTarget?: number | null;
  /** GROUP_OPEN only: smallest amount a guest may chip in; null = platform floor. */
  minContribution?: number | null;
  /** Money confirmed so far. Always 0 until a payment settles. */
  amountFunded: number;
  /** How many guests have chipped in so far. */
  contributorCount: number;
  imageUrl?: string;
  imagePosition?: number;
  imageScale?: number;
  isPurchased: boolean;
  isMostWanted: boolean;
  giftListId: number;
  quantity: number;
  categories?: GiftCategory[];
  order: number;
  cartItems?: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCategory {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCategoryOnGift {
  id: number;
  giftId: number;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftWithWeddingList extends Gift {
  weddingList: WeddingList;
}
