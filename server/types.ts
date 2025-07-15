import { User, Gift, WeddingList, GiftPurchase } from '@prisma/client';

// Base types from Prisma models
export interface UserBase extends Omit<User, 'password'> {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  weddingDate?: Date;
  role: 'USER' | 'ADMIN' | 'COUPLE' | 'GUEST';
  createdAt: Date;
  updatedAt: Date;
}

// User-related interfaces
export interface UserCreateRequest {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  weddingDate?: string;
  role?: 'USER' | 'ADMIN' | 'COUPLE' | 'GUEST';
}

export interface UserUpdateRequest {
  email?: string;
  name?: string;
  password?: string;
  phoneNumber?: string;
  weddingDate?: string;
  role?: 'USER' | 'ADMIN' | 'COUPLE' | 'GUEST';
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse extends UserBase {
  token: string;
  message: string;
}

export interface UserDashboardResponse extends UserBase {
  giftsCount: number;
  totalAmount: number;
}

export interface GiftBase extends Gift {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isPurchased: boolean;
  weddingListId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeddingListBase extends WeddingList {
  id: number;
  coupleId: number;
  title: string;
  description?: string;
  coupleName: string;
  weddingDate: Date;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftPurchaseBase extends GiftPurchase {
  id: number;
  giftId: number;
  userId: number;
  message?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relationships
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  weddingDate?: Date | string;
  role?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GiftWithWeddingList extends GiftBase {
  weddingList: WeddingListBase;
}

export interface WeddingListWithGifts extends WeddingListBase {
  gifts: GiftBase[];
  couple: UserResponse;
}

export interface FormattedWeddingList {
  id: number;
  coupleName: string;
  weddingDate: string;
  imageUrl: string;
  gifts: {
    id: number;
    title: string;
    description?: string;
    price: number;
    isPurchased: boolean;
    weddingListId: number;
    createdAt: string;
    updatedAt: string;
  }[];
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

export interface CreateWeddingListRequest {
  coupleId: number;
  title: string;
  description?: string;
  coupleName: string;
  weddingDate: string;
  imageUrl?: string;
}

export interface PurchaseGiftRequest {
  message?: string;
}

export interface UpdatePurchaseStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}
