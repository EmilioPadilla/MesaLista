import { WeddingList } from '../models/weddingList.js';
import { GiftCategory, GiftType } from '../models/gift.js';

export interface GiftWithWeddingList {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isPurchased: boolean;
  isMostWanted: boolean;
  weddingListId: number;
  categories: GiftCategory[];
  quantity: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  weddingList: WeddingList;
}

export interface GiftWithWeddingListResponse extends Omit<GiftWithWeddingList, 'categories'> {
  categories: string[];
}

/**
 * The group-gift shape a couple can set on create or edit.
 *
 * `price` carries the goal for both group variants (see Gift.price), so the only
 * extra inputs are how the gift is split. Omitting `giftType` leaves a gift SINGLE.
 */
export interface GiftTypeFields {
  giftType?: GiftType;
  /** Required when giftType is GROUP_FIXED: number of equal shares. */
  contributorTarget?: number | null;
  /** Optional when giftType is GROUP_OPEN: minimum a guest may chip in. */
  minContribution?: number | null;
}

// Request types
export interface CreateGiftRequest extends GiftTypeFields {
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string; // For backward compatibility
  categories?: string[]; // New multi-category support
  quantity?: number;
  isMostWanted?: boolean;
  weddingListId: number;
}

export interface UpdateGiftRequest extends GiftTypeFields {
  title?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  category?: string; // For backward compatibility
  categories?: string[]; // New multi-category support
  quantity?: number;
  isMostWanted?: boolean;
}

export interface PurchaseGiftRequest {
  message?: string;
}
