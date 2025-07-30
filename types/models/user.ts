import type { WeddingList } from './weddingList.js';
import type { GiftPurchase } from './gift.js';

/**
 * User model
 */
export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string;
  spouseLastName: string;
  coupleSlug?: string;
  imageUrl?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  weddingList?: WeddingList;
  purchases?: GiftPurchase[];
}

export type UserRole = 'COUPLE' | 'GUEST' | 'ADMIN';
