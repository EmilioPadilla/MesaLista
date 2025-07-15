import { WeddingList } from '@prisma/client';
import { GiftBase } from './gift';
import { UserResponse } from './user';

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
