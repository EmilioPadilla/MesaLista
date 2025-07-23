import type { User } from './user.js';
import type { WeddingList } from './weddingList.js';
import type { CartItem } from './cart.js';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  THANKED = 'THANKED',
}

export interface Gift {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string;
  isPurchased: boolean;
  isMostWanted: boolean;
  weddingListId: number;
  quantity: number;
  order: number;
  categories?: GiftCategory[];
  purchases?: GiftPurchase[];
  cartItems?: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftPurchase {
  id: number;
  giftId: number;
  userId: number;
  purchaseDate: Date;
  status: PurchaseStatus;
  message?: string;
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

export interface GiftPurchaseWithRelations {
  gift: Gift;
  user: User;
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
