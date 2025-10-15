import type { WeddingList } from './weddingList.js';

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
  planType?: PlanType;
  createdAt: Date;
  updatedAt: Date;
  weddingList?: WeddingList;
}

export type UserRole = 'COUPLE' | 'GUEST' | 'ADMIN';
export type PlanType = 'FIXED' | 'COMMISSION';
