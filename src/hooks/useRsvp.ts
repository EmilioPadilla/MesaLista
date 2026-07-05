import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rsvpService, {
  Invitee,
  CreateInviteeRequest,
  RsvpStats,
  RsvpMessages,
  RsvpCustomField,
  RsvpCustomFieldResponse,
  RsvpCustomFieldType,
} from '../services/rsvp.service';

const queryKeys = {
  invitees: (giftListId: number) => ['invitees', giftListId] as const,
  inviteeByCode: (code: string, giftListId: number) => ['invitee', giftListId, code] as const,
  validateCode: (code: string, giftListId: number) => ['validate-rsvp-code', giftListId, code] as const,
  stats: (giftListId: number) => ['rsvp-stats', giftListId] as const,
  messages: (giftListId: number) => ['rsvp-messages', giftListId] as const,
  customFields: (giftListId: number) => ['rsvp-custom-fields', giftListId] as const,
  customFieldResponses: (giftListId: number) => ['rsvp-custom-field-responses', giftListId] as const,
};

// Query: Get all invitees for a gift list
export const useInvitees = (giftListId: number) => {
  return useQuery<Invitee[], Error>({
    queryKey: queryKeys.invitees(giftListId),
    queryFn: () => rsvpService.getInvitees(giftListId),
    enabled: !!giftListId,
  });
};

// Query: Get invitee by secret code within a gift list (public)
export const useInviteeByCode = (secretCode: string, giftListId: number, enabled: boolean = true) => {
  return useQuery<Invitee, Error>({
    queryKey: queryKeys.inviteeByCode(secretCode, giftListId),
    queryFn: () => rsvpService.getInviteeByCode(secretCode, giftListId),
    enabled: enabled && !!secretCode && !!giftListId,
  });
};

// Query: Validate RSVP code within a gift list (public)
export const useValidateRsvpCode = (secretCode: string, giftListId: number, enabled: boolean = true) => {
  return useQuery<{ valid: boolean; message: string }, Error>({
    queryKey: queryKeys.validateCode(secretCode, giftListId),
    queryFn: () => rsvpService.validateRsvpCode(secretCode, giftListId),
    enabled: enabled && !!secretCode.trim() && !!giftListId,
    retry: false, // Don't retry on validation failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Mutation: Create a new invitee
export const useCreateInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitee, Error, CreateInviteeRequest>({
    mutationFn: (data) => rsvpService.createInvitee(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Bulk create invitees
export const useBulkCreateInvitees = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { created: Invitee[]; errors: any[] },
    Error,
    { giftListId: number; invitees: Omit<CreateInviteeRequest, 'giftListId'>[] }
  >({
    mutationFn: ({ giftListId, invitees }) => rsvpService.bulkCreateInvitees(giftListId, invitees),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Update an invitee
export const useUpdateInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitee, Error, { id: string; giftListId: number; data: Partial<CreateInviteeRequest> }>({
    mutationFn: ({ id, data }) => rsvpService.updateInvitee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Delete an invitee
export const useDeleteInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; giftListId: number }>({
    mutationFn: ({ id }) => rsvpService.deleteInvitee(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Bulk delete invitees
export const useBulkDeleteInvitees = () => {
  const queryClient = useQueryClient();

  return useMutation<{ count: number }, Error, { ids: string[]; giftListId: number }>({
    mutationFn: ({ ids }) => rsvpService.bulkDeleteInvitees(ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Bulk update invitee status
export const useBulkUpdateInviteeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<{ count: number }, Error, { ids: string[]; giftListId: number; status: 'PENDING' | 'CONFIRMED' | 'REJECTED' }>({
    mutationFn: ({ ids, status }) => rsvpService.bulkUpdateInviteeStatus(ids, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(variables.giftListId) });
    },
  });
};

// Mutation: Respond to RSVP (public)
export const useRespondToRsvp = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Invitee,
    Error,
    {
      secretCode: string;
      giftListId: number;
      status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
      confirmedTickets?: number;
      guestMessage?: string;
      customFieldResponses?: Array<{ fieldId: number; value: string }>;
    }
  >({
    mutationFn: ({ secretCode, giftListId, status, confirmedTickets, guestMessage, customFieldResponses }) =>
      rsvpService.respondToRsvp(secretCode, giftListId, status, confirmedTickets, guestMessage, customFieldResponses),
    onSuccess: (data) => {
      // Invalidate the specific invitee query
      queryClient.invalidateQueries({
        queryKey: queryKeys.inviteeByCode(data.secretCode, data.giftListId),
      });
    },
  });
};

// Query: Get RSVP statistics
export const useRsvpStats = (giftListId: number) => {
  return useQuery<RsvpStats, Error>({
    queryKey: queryKeys.stats(giftListId),
    queryFn: () => rsvpService.getStats(giftListId),
    enabled: !!giftListId,
  });
};

// Query: Get RSVP messages for a gift list (public)
export const useRsvpMessages = (giftListId: number, enabled: boolean = true) => {
  return useQuery<RsvpMessages, Error>({
    queryKey: queryKeys.messages(giftListId),
    queryFn: () => rsvpService.getMessages(giftListId),
    enabled: enabled && !!giftListId,
  });
};

// Query: Get custom fields for a gift list (public)
export const useRsvpCustomFields = (giftListId: number, enabled: boolean = true) => {
  return useQuery<RsvpCustomField[], Error>({
    queryKey: queryKeys.customFields(giftListId),
    queryFn: () => rsvpService.getCustomFields(giftListId),
    enabled: enabled && !!giftListId,
  });
};

// Mutation: Create a custom field
export const useCreateRsvpCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RsvpCustomField,
    Error,
    { giftListId: number; label: string; type: RsvpCustomFieldType; required?: boolean; order?: number }
  >({
    mutationFn: (data) => rsvpService.createCustomField(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields(variables.giftListId) });
    },
  });
};

// Mutation: Update a custom field
export const useUpdateRsvpCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RsvpCustomField,
    Error,
    { id: number; giftListId: number; data: { label?: string; type?: RsvpCustomFieldType; required?: boolean; order?: number } }
  >({
    mutationFn: ({ id, data }) => rsvpService.updateCustomField(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields(variables.giftListId) });
    },
  });
};

// Mutation: Delete a custom field
export const useDeleteRsvpCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; giftListId: number }>({
    mutationFn: ({ id }) => rsvpService.deleteCustomField(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields(variables.giftListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customFieldResponses(variables.giftListId) });
    },
  });
};

// Query: Get custom field responses for a gift list's invitees
export const useRsvpCustomFieldResponses = (giftListId: number) => {
  return useQuery<RsvpCustomFieldResponse[], Error>({
    queryKey: queryKeys.customFieldResponses(giftListId),
    queryFn: () => rsvpService.getCustomFieldResponses(giftListId),
    enabled: !!giftListId,
  });
};

// Mutation: Update RSVP messages
export const useUpdateRsvpMessages = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RsvpMessages,
    Error,
    {
      giftListId: number;
      confirmationMessage?: string;
      cancellationMessage?: string;
    }
  >({
    mutationFn: (data) => rsvpService.updateMessages(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(data.giftListId),
      });
    },
  });
};
