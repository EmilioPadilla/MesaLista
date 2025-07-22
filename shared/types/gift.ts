import type { Gift, GiftPurchase, PurchaseStatus } from '@prisma/client';
import type { UserResponse } from './user.js';
import type { WeddingListBase } from './weddingList.js';

export interface GiftBase {
  id: number;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPurchased: boolean;
  isMostWanted: boolean;
  quantity: number;
  order: number;
  weddingListId: number;
  createdAt: Date;
  updatedAt: Date;
  categories: string[];
}

export interface GiftPurchaseBase extends GiftPurchase {
  id: number;
  giftId: number;
  userId: number;
  message: string | null;
  status: PurchaseStatus;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftWithWeddingList extends GiftBase {
  weddingList: WeddingListBase;
}

export interface GiftPurchaseWithRelations extends GiftPurchaseBase {
  gift: GiftBase;
  user: UserResponse;
}

export interface FormattedPurchase {
  id: number;
  giftName: string;
  price: number;
  purchaseDate: string;
  purchasedBy: {
    id: number;
    name: string;
    email: string;
  };
  status: PurchaseStatus;
  message: string | null;
}

export interface UserPurchase {
  id: number;
  giftName: string;
  price: number;
  purchaseDate: string;
  couple: {
    id: number;
    name: string;
    email: string;
  };
  status: PurchaseStatus;
  message: string | null;
}

export interface PurchaseGiftResponse {
  purchase: GiftPurchaseWithRelations;
  gift: GiftBase;
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
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string; // For backward compatibility
  categories?: string[]; // New multi-category support
  quantity?: number;
  isMostWanted?: boolean;
  weddingListId: number;
}

export interface UpdateGiftRequest {
  title?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string; // For backward compatibility
  categories?: string[]; // New multi-category support
  quantity?: number;
  isMostWanted?: boolean;
}

export interface PurchaseGiftRequest {
  message?: string;
}

export interface UpdatePurchaseStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}
