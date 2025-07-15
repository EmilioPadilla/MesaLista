import { Gift, GiftPurchase, PurchaseStatus } from '@prisma/client';
import { UserResponse } from './user.js';
import { WeddingListBase } from './weddingList.js';

export interface GiftBase extends Gift {
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isPurchased: boolean;
  weddingListId: number;
  createdAt: Date;
  updatedAt: Date;
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
  status: string;
  message?: string;
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
  status: string;
  message?: string;
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
  category?: string;
  weddingListId: number;
}

export interface UpdateGiftRequest {
  title?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
}

export interface PurchaseGiftRequest {
  message?: string;
}

export interface UpdatePurchaseStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}
