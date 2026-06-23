import apiClient from './client';
import { rsvpEndpoints } from './rsvp.endpoints';

export interface Invitee {
  id: string;
  giftListId: number;
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmedTickets?: number;
  guestMessage?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface CreateInviteeRequest {
  giftListId: number;
  firstName?: string;
  lastName?: string;
  tickets?: number;
  secretCode?: string;
  guestMessage?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface RsvpMessages {
  id: number;
  giftListId: number;
  confirmationMessage: string;
  cancellationMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpStats {
  total: number;
  confirmed: number;
  rejected: number;
  pending: number;
  totalTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  rejectedTickets: number;
}

export type RsvpCustomFieldType = 'TEXT' | 'NUMBER' | 'BOOLEAN';

export interface RsvpCustomField {
  id: number;
  giftListId: number;
  label: string;
  type: RsvpCustomFieldType;
  required: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpCustomFieldResponse {
  id: number;
  inviteeId: string;
  fieldId: number;
  value: string;
  field: RsvpCustomField;
  createdAt: string;
  updatedAt: string;
}

const rsvpService = {
  // Get all invitees for a gift list
  async getInvitees(giftListId: number): Promise<Invitee[]> {
    const response = await apiClient.get(rsvpEndpoints.getInvitees, {
      params: { giftListId },
    });
    return response.data.data;
  },

  // Get invitee by secret code (public)
  async getInviteeByCode(secretCode: string): Promise<Invitee> {
    const response = await apiClient.get(rsvpEndpoints.getInviteeByCode(secretCode));
    return response.data.data;
  },

  // Validate RSVP code (public)
  async validateRsvpCode(secretCode: string): Promise<{ valid: boolean; message: string }> {
    const response = await apiClient.get(rsvpEndpoints.validateRsvpCode(secretCode));
    return { valid: response.data.valid, message: response.data.message };
  },

  // Create a new invitee
  async createInvitee(data: CreateInviteeRequest): Promise<Invitee> {
    const response = await apiClient.post(rsvpEndpoints.createInvitee, data);
    return response.data.data;
  },

  // Bulk create invitees
  async bulkCreateInvitees(
    giftListId: number,
    invitees: Omit<CreateInviteeRequest, 'giftListId'>[],
  ): Promise<{
    created: Invitee[];
    errors: any[];
  }> {
    const response = await apiClient.post(rsvpEndpoints.bulkCreateInvitees, { giftListId, invitees });
    return response.data.data;
  },

  // Update an invitee
  async updateInvitee(id: string, data: Partial<CreateInviteeRequest>): Promise<Invitee> {
    const response = await apiClient.put(rsvpEndpoints.updateInvitee(id), data);
    return response.data.data;
  },

  // Delete an invitee
  async deleteInvitee(id: string): Promise<void> {
    await apiClient.delete(rsvpEndpoints.deleteInvitee(id));
  },

  // Bulk delete invitees
  async bulkDeleteInvitees(ids: string[]): Promise<{ count: number }> {
    const response = await apiClient.post(rsvpEndpoints.bulkDeleteInvitees, { ids });
    return response.data.data;
  },

  // Bulk update invitee status
  async bulkUpdateInviteeStatus(ids: string[], status: 'PENDING' | 'CONFIRMED' | 'REJECTED'): Promise<{ count: number }> {
    const response = await apiClient.post(rsvpEndpoints.bulkUpdateInviteeStatus, { ids, status });
    return response.data.data;
  },

  // Respond to RSVP (public)
  async respondToRsvp(
    secretCode: string,
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED',
    confirmedTickets?: number,
    guestMessage?: string,
    customFieldResponses?: Array<{ fieldId: number; value: string }>,
  ): Promise<Invitee> {
    const response = await apiClient.post(rsvpEndpoints.respondToRsvp(secretCode), {
      status,
      confirmedTickets,
      guestMessage,
      customFieldResponses,
    });
    return response.data.data;
  },

  // Get RSVP statistics
  async getStats(giftListId: number): Promise<RsvpStats> {
    const response = await apiClient.get(rsvpEndpoints.getStats, {
      params: { giftListId },
    });
    return response.data.data;
  },

  // Get RSVP messages for a gift list (public)
  async getMessages(giftListId: number): Promise<RsvpMessages> {
    const response = await apiClient.get(rsvpEndpoints.getMessages(giftListId));
    return response.data.data;
  },

  // Update RSVP messages
  async updateMessages(data: { giftListId: number; confirmationMessage?: string; cancellationMessage?: string }): Promise<RsvpMessages> {
    const response = await apiClient.put(rsvpEndpoints.updateMessages, data);
    return response.data.data;
  },

  // ─── Custom Fields ────────────────────────────────────────────────────────

  async getCustomFields(giftListId: number): Promise<RsvpCustomField[]> {
    const response = await apiClient.get(rsvpEndpoints.getCustomFields(giftListId));
    return response.data.data;
  },

  async createCustomField(data: {
    giftListId: number;
    label: string;
    type: RsvpCustomFieldType;
    required?: boolean;
    order?: number;
  }): Promise<RsvpCustomField> {
    const response = await apiClient.post(rsvpEndpoints.createCustomField, data);
    return response.data.data;
  },

  async updateCustomField(
    id: number,
    data: { label?: string; type?: RsvpCustomFieldType; required?: boolean; order?: number },
  ): Promise<RsvpCustomField> {
    const response = await apiClient.put(rsvpEndpoints.updateCustomField(id), data);
    return response.data.data;
  },

  async deleteCustomField(id: number): Promise<void> {
    await apiClient.delete(rsvpEndpoints.deleteCustomField(id));
  },

  async getCustomFieldResponses(giftListId: number): Promise<RsvpCustomFieldResponse[]> {
    const response = await apiClient.get(rsvpEndpoints.getCustomFieldResponses, { params: { giftListId } });
    return response.data.data;
  },
};

export default rsvpService;
