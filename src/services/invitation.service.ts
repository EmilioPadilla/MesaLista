import apiClient from './client';
import { api_endpoints } from './endpoints';
import type { CreateInvitationRequest, UpdateInvitationRequest, InvitationResponse } from 'types/api/invitation';

export const invitationService = {
  /**
   * Get invitation by gift list ID (public - no auth required)
   */
  getByGiftListIdPublic: async (giftListId: number): Promise<InvitationResponse> => {
    const response = await apiClient.get(api_endpoints.invitations.byGiftListIdPublic(giftListId), { skipAuth: true } as any);
    return response.data;
  },

  /**
   * Get invitation by gift list ID (protected)
   */
  getByGiftListId: async (giftListId: number): Promise<InvitationResponse> => {
    const response = await apiClient.get(api_endpoints.invitations.byGiftListId(giftListId));
    return response.data;
  },

  /**
   * Get invitation by slug (public)
   */
  getBySlug: async (slug: string): Promise<InvitationResponse> => {
    const response = await apiClient.get(api_endpoints.invitations.bySlug(slug), { skipAuth: true } as any);
    return response.data;
  },

  /**
   * Get invitation by ID
   */
  getById: async (id: number): Promise<InvitationResponse> => {
    const response = await apiClient.get(api_endpoints.invitations.byId(id));
    return response.data;
  },

  /**
   * Create a new invitation
   */
  create: async (data: CreateInvitationRequest): Promise<InvitationResponse> => {
    const response = await apiClient.post(api_endpoints.invitations.create, data);
    return response.data;
  },

  /**
   * Update an invitation
   */
  update: async (id: number, data: UpdateInvitationRequest): Promise<InvitationResponse> => {
    const response = await apiClient.put(api_endpoints.invitations.update(id), data);
    return response.data;
  },

  /**
   * Publish an invitation
   */
  publish: async (id: number, slug: string): Promise<InvitationResponse> => {
    const response = await apiClient.post(api_endpoints.invitations.publish(id), { slug });
    return response.data;
  },

  /**
   * Delete an invitation
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(api_endpoints.invitations.delete(id));
  },
};
