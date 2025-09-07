import type { WeddingList } from './weddingList.js';
import type { CartItem } from './cart.js';

export interface Gift {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string;
  imagePosition?: number;
  isPurchased: boolean;
  isMostWanted: boolean;
  weddingListId: number;
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
