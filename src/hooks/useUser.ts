import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { message } from 'antd';
import { userService } from '../services/user.service';
import { queryKeys } from './queryKeys';
import { User } from 'types/models/user';

/**
 * Hook to fetch the current authenticated user.
 *
 * Returns `null` (cached) when the user is not authenticated so navigation
 * across pages does not refetch /user/me on every mount.
 *
 * @param options React Query options
 */
export const useCurrentUser = (options?: Partial<UseQueryOptions<User | null, Error>>) => {
  return useQuery<User | null, Error>({
    queryKey: [queryKeys.currentUser],
    queryFn: async () => {
      try {
        return await userService.getCurrentUser(true);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook to check if the user is authenticated.
 * Derives from useCurrentUser so both share a single /user/me request.
 */
export const useIsAuthenticated = () => {
  const { data, isLoading, isFetching, isError, error } = useCurrentUser();
  return {
    data: !!data,
    isLoading,
    isFetching,
    isError,
    error,
  };
};

/**
 * Hook to fetch all users
 *
 * @param options React Query options
 */
export const useUsers = (options?: Partial<UseQueryOptions<User[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.users],
    queryFn: () => userService.getAll(),
    ...options,
  });
};

/**
 * Hook to fetch a user by ID
 *
 * @param userId ID of the user
 * @param options React Query options
 */
export const useUserById = (userId: number | undefined, options?: Partial<UseQueryOptions<User, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.users, userId],
    queryFn: () => userService.getById(userId!),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to fetch a user by couple slug
 */
export const useGetUserBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: [queryKeys.userBySlug, slug],
    queryFn: () => userService.getBySlug(slug!),
    enabled: !!slug,
  });
};

/**
 * Hook to login a user
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => userService.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
};

/**
 * Hook to logout the current user
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  return {
    logout: async () => {
      await userService.logout();
      queryClient.removeQueries({ queryKey: [queryKeys.currentUser] });
    },
  };
};

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
    },
  });
};

export const useSignupCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.signupCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
    },
  });
};

/**
 * Hook to delete a user (admin only)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => userService.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      queryClient.invalidateQueries({ queryKey: ['usersListsAnalytics'] });
      message.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al eliminar el usuario';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to check if a couple slug is available
 *
 * @param slug Couple slug to check
 * @param excludeUserId Optional user ID to exclude from the check (for updates)
 * @param options React Query options
 */
export const useCheckSlugAvailability = (
  slug: string | undefined,
  excludeUserId?: number,
  options?: Partial<UseQueryOptions<{ available: boolean; slug: string; message: string }, Error>>,
) => {
  return useQuery({
    queryKey: [queryKeys.users, 'checkSlug', slug, excludeUserId],
    queryFn: () => userService.checkSlugAvailability(slug!, excludeUserId),
    enabled: !!slug && slug.length > 0,
    staleTime: 0, // Always fetch fresh data
    ...options,
  });
};

/**
 * Hook to update current user profile
 */
export const useUpdateCurrentUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      spouseFirstName?: string;
      spouseLastName?: string;
      phoneNumber?: string;
      slug?: string;
    }) => userService.updateCurrentUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      message.success('Perfil actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el perfil';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to update current user password
 */
export const useUpdateCurrentUserPassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => userService.updateCurrentUserPassword(data),
    onSuccess: () => {
      message.success('Contraseña actualizada exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al actualizar la contraseña';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to delete current user account
 */
export const useDeleteCurrentUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.deleteCurrentUser(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      message.success('Cuenta eliminada exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al eliminar la cuenta';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to update user plan type (admin only)
 */
export const useUpdateUserPlanType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, planType }: { userId: number; planType: 'FIXED' | 'COMMISSION' }) =>
      userService.updateUserPlanType(userId, planType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      queryClient.invalidateQueries({ queryKey: ['usersListsAnalytics'] });
      message.success('Plan actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el plan';
      message.error(errorMessage);
    },
  });
};
