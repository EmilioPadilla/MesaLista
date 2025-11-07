import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rsvpService, { Invitee, CreateInviteeRequest, RsvpStats, RsvpMessages } from '../services/rsvp.service';

const queryKeys = {
  invitees: ['invitees'] as const,
  inviteeByCode: (code: string) => ['invitee', code] as const,
  validateCode: (code: string) => ['validate-rsvp-code', code] as const,
  stats: ['rsvp-stats'] as const,
  messages: (coupleId: number) => ['rsvp-messages', coupleId] as const,
};

// Query: Get all invitees for authenticated couple
export const useInvitees = () => {
  return useQuery<Invitee[], Error>({
    queryKey: queryKeys.invitees,
    queryFn: () => rsvpService.getInvitees(),
  });
};

// Query: Get invitee by secret code (public)
export const useInviteeByCode = (secretCode: string, enabled: boolean = true) => {
  return useQuery<Invitee, Error>({
    queryKey: queryKeys.inviteeByCode(secretCode),
    queryFn: () => rsvpService.getInviteeByCode(secretCode),
    enabled: enabled && !!secretCode,
  });
};

// Query: Validate RSVP code (public)
export const useValidateRsvpCode = (secretCode: string, enabled: boolean = true) => {
  return useQuery<{ valid: boolean; message: string }, Error>({
    queryKey: queryKeys.validateCode(secretCode),
    queryFn: () => rsvpService.validateRsvpCode(secretCode),
    enabled: enabled && !!secretCode.trim(),
    retry: false, // Don't retry on validation failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Mutation: Create a new invitee
export const useCreateInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitee, Error, CreateInviteeRequest>({
    mutationFn: (data) => rsvpService.createInvitee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// Mutation: Bulk create invitees
export const useBulkCreateInvitees = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { created: Invitee[]; errors: any[] },
    Error,
    CreateInviteeRequest[]
  >({
    mutationFn: (invitees) => rsvpService.bulkCreateInvitees(invitees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// Mutation: Update an invitee
export const useUpdateInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Invitee,
    Error,
    { id: string; data: Partial<CreateInviteeRequest> }
  >({
    mutationFn: ({ id, data }) => rsvpService.updateInvitee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// Mutation: Delete an invitee
export const useDeleteInvitee = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => rsvpService.deleteInvitee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// Mutation: Bulk delete invitees
export const useBulkDeleteInvitees = () => {
  const queryClient = useQueryClient();

  return useMutation<{ count: number }, Error, string[]>({
    mutationFn: (ids) => rsvpService.bulkDeleteInvitees(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// Mutation: Bulk update invitee status
export const useBulkUpdateInviteeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { count: number },
    Error,
    { ids: string[]; status: 'PENDING' | 'CONFIRMED' | 'REJECTED' }
  >({
    mutationFn: ({ ids, status }) => rsvpService.bulkUpdateInviteeStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitees });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
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
      status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
      confirmedTickets?: number;
      guestMessage?: string;
    }
  >({
    mutationFn: ({ secretCode, status, confirmedTickets, guestMessage }) =>
      rsvpService.respondToRsvp(secretCode, status, confirmedTickets, guestMessage),
    onSuccess: (data) => {
      // Invalidate the specific invitee query
      queryClient.invalidateQueries({
        queryKey: queryKeys.inviteeByCode(data.secretCode),
      });
    },
  });
};

// Query: Get RSVP statistics
export const useRsvpStats = () => {
  return useQuery<RsvpStats, Error>({
    queryKey: queryKeys.stats,
    queryFn: () => rsvpService.getStats(),
  });
};

// Query: Get RSVP messages for a couple (public)
export const useRsvpMessages = (coupleId: number, enabled: boolean = true) => {
  return useQuery<RsvpMessages, Error>({
    queryKey: queryKeys.messages(coupleId),
    queryFn: () => rsvpService.getMessages(coupleId),
    enabled: enabled && !!coupleId,
  });
};

// Mutation: Update RSVP messages
export const useUpdateRsvpMessages = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RsvpMessages,
    Error,
    {
      confirmationMessage?: string;
      cancellationMessage?: string;
    }
  >({
    mutationFn: (data) => rsvpService.updateMessages(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(data.coupleId),
      });
    },
  });
};
