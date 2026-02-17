import { PlanType } from '@prisma/client';

export interface CreateGiftListRequest {
  userId: number;
  title: string;
  description?: string | null;
  coupleName: string;
  eventDate: string;
  imageUrl?: string | null;
  planType?: PlanType;
  discountCodeId?: number;
}

export interface UpdateGiftListRequest {
  id?: number;
  title?: string;
  description?: string | null;
  coupleName?: string;
  eventDate?: string;
  eventLocation?: string | null;
  eventVenue?: string | null;
  imageUrl?: string | null;
  invitationCount?: number;
  planType?: PlanType;
  isActive?: boolean;
  isPublic?: boolean;
  feePreference?: 'couple' | 'guest';
}
