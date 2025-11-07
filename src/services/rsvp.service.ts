import apiClient from './client';
import { endpoints } from './endpoints';

export interface Invitee {
  id: string;
  coupleId: number;
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
  firstName?: string;
  lastName?: string;
  tickets?: number;
  secretCode?: string;
}

export interface RsvpMessages {
  id: number;
  coupleId: number;
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

const rsvpService = {
  // Get all invitees for authenticated couple
  async getInvitees(): Promise<Invitee[]> {
    const response = await apiClient.get(endpoints.rsvp.getInvitees);
    return response.data.data;
  },

  // Get invitee by secret code (public)
  async getInviteeByCode(secretCode: string): Promise<Invitee> {
    const response = await apiClient.get(endpoints.rsvp.getInviteeByCode(secretCode));
    return response.data.data;
  },

  // Validate RSVP code (public)
  async validateRsvpCode(secretCode: string): Promise<{ valid: boolean; message: string }> {
    const response = await apiClient.get(endpoints.rsvp.validateRsvpCode(secretCode));
    return { valid: response.data.valid, message: response.data.message };
  },

  // Create a new invitee
  async createInvitee(data: CreateInviteeRequest): Promise<Invitee> {
    const response = await apiClient.post(endpoints.rsvp.createInvitee, data);
    return response.data.data;
  },

  // Bulk create invitees
  async bulkCreateInvitees(invitees: CreateInviteeRequest[]): Promise<{
    created: Invitee[];
    errors: any[];
  }> {
    const response = await apiClient.post(endpoints.rsvp.bulkCreateInvitees, { invitees });
    return response.data.data;
  },

  // Update an invitee
  async updateInvitee(id: string, data: Partial<CreateInviteeRequest>): Promise<Invitee> {
    const response = await apiClient.put(endpoints.rsvp.updateInvitee(id), data);
    return response.data.data;
  },

  // Delete an invitee
  async deleteInvitee(id: string): Promise<void> {
    await apiClient.delete(endpoints.rsvp.deleteInvitee(id));
  },

  // Bulk delete invitees
  async bulkDeleteInvitees(ids: string[]): Promise<{ count: number }> {
    const response = await apiClient.post(endpoints.rsvp.bulkDeleteInvitees, { ids });
    return response.data.data;
  },

  // Bulk update invitee status
  async bulkUpdateInviteeStatus(ids: string[], status: 'PENDING' | 'CONFIRMED' | 'REJECTED'): Promise<{ count: number }> {
    const response = await apiClient.post(endpoints.rsvp.bulkUpdateInviteeStatus, { ids, status });
    return response.data.data;
  },

  // Respond to RSVP (public)
  async respondToRsvp(
    secretCode: string,
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED',
    confirmedTickets?: number,
    guestMessage?: string
  ): Promise<Invitee> {
    const response = await apiClient.post(endpoints.rsvp.respondToRsvp(secretCode), {
      status,
      confirmedTickets,
      guestMessage,
    });
    return response.data.data;
  },

  // Get RSVP statistics
  async getStats(): Promise<RsvpStats> {
    const response = await apiClient.get(endpoints.rsvp.getStats);
    return response.data.data;
  },

  // Get RSVP messages for a couple (public)
  async getMessages(coupleId: number): Promise<RsvpMessages> {
    const response = await apiClient.get(endpoints.rsvp.getMessages(coupleId));
    return response.data.data;
  },

  // Update RSVP messages
  async updateMessages(data: {
    confirmationMessage?: string;
    cancellationMessage?: string;
  }): Promise<RsvpMessages> {
    const response = await apiClient.put(endpoints.rsvp.updateMessages, data);
    return response.data.data;
  },
};

export default rsvpService;
