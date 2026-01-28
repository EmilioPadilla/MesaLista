import { InvitationStatus } from '../models/invitation';

export interface CreateInvitationRequest {
  giftListId: number;
  templateId: string;
  eventName: string;
  slug: string;
  htmlContent: string;
  formData: Record<string, any>;
  customColors?: Record<string, string>;
}

export interface UpdateInvitationRequest {
  eventName?: string;
  formData?: Record<string, any>;
  customColors?: Record<string, string>;
  htmlContent?: string;
  status?: InvitationStatus;
}

export interface PublishInvitationRequest {
  slug: string;
}

export interface InvitationResponse {
  id: number;
  giftListId: number;
  templateId: string;
  eventName: string;
  slug: string;
  htmlContent: string;
  formData: Record<string, any>;
  customColors?: Record<string, string>;
  status: InvitationStatus;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
