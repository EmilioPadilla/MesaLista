import type { User } from './user.js';
import type { Gift } from './gift.js';
import type { PlanType } from '@prisma/client';

export interface GiftList {
  id: number;
  userId: number;
  title: string;
  description?: string;
  coupleName: string;
  invitationCount: number;
  eventDate: Date;
  eventLocation?: string;
  eventVenue?: string;
  imageUrl?: string;
  planType?: PlanType;
  discountCodeId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  gifts: Gift[];
}

export interface GiftListWithGifts extends GiftList {
  gifts: Gift[];
  user: User;
}

export interface FormattedGiftList {
  id: number;
  coupleName: string;
  eventDate: string;
  imageUrl: string;
  gifts: {
    id: number;
    title: string;
    description?: string;
    price: number;
    isPurchased: boolean;
    giftListId: number;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface GiftListBrief {
  id: number;
  coupleName: string;
  eventLocation?: string;
  eventVenue?: string;
  description?: string;
  eventDate: string;
  imageUrl: string;
  totalGifts: number;
  purchasedGifts: number;
  userSlug: string;
  invitationSlug?: string;
}

export interface CreateGiftListRequest {
  userId: number;
  title: string;
  description?: string;
  coupleName: string;
  eventDate: string;
  imageUrl?: string;
  planType?: PlanType;
  discountCodeId?: number;
}

export interface UpdateGiftListRequest {
  id?: number;
  title?: string;
  description?: string;
  coupleName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventVenue?: string;
  imageUrl?: string;
  invitationCount?: number;
  planType?: PlanType;
  isActive?: boolean;
}
