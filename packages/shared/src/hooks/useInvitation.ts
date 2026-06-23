import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { invitationService } from 'src/services/invitation.service';
import type { CreateInvitationRequest, UpdateInvitationRequest, InvitationResponse } from 'types/api/invitation';

export const queryKeys = {
  invitations: 'invitations',
  invitationByGiftList: 'invitationByGiftList',
  invitationBySlug: 'invitationBySlug',
  invitationById: 'invitationById',
};

/**
 * Hook to fetch invitation by gift list ID (public - no auth required)
 */
export const useInvitationByGiftListPublic = (
  giftListId: number | undefined,
  options?: Partial<UseQueryOptions<InvitationResponse, Error>>,
) => {
  return useQuery({
    queryKey: [queryKeys.invitationByGiftList, giftListId, 'public'],
    queryFn: () => invitationService.getByGiftListIdPublic(giftListId!),
    enabled: !!giftListId,
    ...options,
  });
};

/**
 * Hook to fetch invitation by gift list ID (protected)
 */
export const useInvitationByGiftList = (giftListId: number | undefined, options?: Partial<UseQueryOptions<InvitationResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.invitationByGiftList, giftListId],
    queryFn: () => invitationService.getByGiftListId(giftListId!),
    enabled: !!giftListId,
    ...options,
  });
};

/**
 * Hook to fetch invitation by slug (public)
 */
export const useInvitationBySlug = (slug: string | undefined, options?: Partial<UseQueryOptions<InvitationResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.invitationBySlug, slug],
    queryFn: () => invitationService.getBySlug(slug!),
    enabled: !!slug,
    ...options,
  });
};

/**
 * Hook to fetch invitation by ID
 */
export const useInvitationById = (id: number | undefined, options?: Partial<UseQueryOptions<InvitationResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.invitationById, id],
    queryFn: () => invitationService.getById(id!),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to create a new invitation
 */
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvitationRequest) => invitationService.create(data),
    onSuccess: (data) => {
      // Invalidate and refetch invitation queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationByGiftList, data.giftListId] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitations] });
    },
  });
};

/**
 * Hook to update an invitation
 */
export const useUpdateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInvitationRequest }) => invitationService.update(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch invitation queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationById, data.id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationByGiftList, data.giftListId] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitations] });
    },
  });
};

/**
 * Hook to publish an invitation
 */
export const usePublishInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, slug }: { id: number; slug: string }) => invitationService.publish(id, slug),
    onSuccess: (data) => {
      // Invalidate and refetch invitation queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationById, data.id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationByGiftList, data.giftListId] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationBySlug, data.slug] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitations] });
    },
  });
};

/**
 * Hook to delete an invitation
 */
export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invitationService.delete(id),
    onSuccess: () => {
      // Invalidate all invitation queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitations] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.invitationByGiftList] });
    },
  });
};
