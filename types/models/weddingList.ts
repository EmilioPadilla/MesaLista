import type { User } from './user.js';
import type { Gift } from './gift.js';

export interface WeddingList {
  id: number;
  coupleId: number;
  title: string;
  description?: string;
  coupleName: string;
  invitationCount: number;
  weddingDate: Date;
  weddingLocation?: string;
  weddingVenue?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  couple: User;
  gifts: Gift[];
}

export interface WeddingListWithGifts extends WeddingList {
  gifts: Gift[];
  couple: User;
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

export interface WeddingListBrief {
  id: number;
  coupleName: string;
  slug: string;
  weddingLocation?: string;
  weddingVenue?: string;
  description?: string;
  weddingDate: Date;
  imageUrl: string;
  totalGifts: number;
  purchasedGifts: number;
}

export interface CreateWeddingListRequest {
  coupleId: number;
  title: string;
  description?: string;
  coupleName: string;
  weddingDate: string;
  imageUrl?: string;
}

export interface UpdateWeddingListRequest {
  id: number;
  title?: string;
  description?: string;
  coupleName?: string;
  weddingDate?: string;
  weddingLocation?: string;
  weddingVenue?: string;
  imageUrl?: string;
  invitationCount?: number;
}
