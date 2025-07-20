import type { WeddingList } from '@prisma/client';
import type { GiftBase } from './gift.js';
import type { UserResponse } from './user.js';

export interface WeddingListBase extends WeddingList {
  id: number;
  coupleId: number;
  title: string;
  description: string | null;
  coupleName: string;
  weddingDate: Date;
  invitationCount: number;
  weddingLocation: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface CreateWeddingListRequest {
  coupleId: number;
  title: string;
  description?: string;
  coupleName: string;
  weddingDate: string;
  imageUrl?: string;
}
