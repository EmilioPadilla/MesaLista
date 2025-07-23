import { WeddingList } from '../models/weddingList.js';
import { Gift, GiftCategory, GiftPurchaseWithRelations, FormattedPurchase, UserPurchase } from '../models/gift.js';

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

export interface PurchaseGiftResponse {
  purchase: GiftPurchaseWithRelations;
  gift: Gift;
}

export interface PurchasedGiftsResponse {
  purchases: FormattedPurchase[];
  totalAmount: number;
  count: number;
}

export interface UserPurchasesResponse {
  purchases: UserPurchase[];
  count: number;
}

// Request types
export interface CreateGiftRequest {
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

export interface UpdateGiftRequest {
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
