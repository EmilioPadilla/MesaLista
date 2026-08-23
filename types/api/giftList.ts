import { PlanType } from '@prisma/client';

export interface CreateGiftListRequest {
  userId: number;
  title: string;
  description?: string | null;
  coupleName: string;
  eventDate: string;
  imageUrl?: string | null;
  discountCodeId?: number;
}

export interface PublishGiftListRequest {
  planType: PlanType;
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
  // `planType` is deliberately absent: it is set once by the publish endpoint and
  // immutable afterwards, so the general update must not be able to carry it.
  isActive?: boolean;
  isPublic?: boolean;
  feePreference?: 'couple' | 'guest';
  thankYouMessage?: string | null;
}
