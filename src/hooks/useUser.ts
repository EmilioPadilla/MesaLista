import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { message } from 'antd';
import { userService } from '../services/user.service';
import { queryKeys } from './queryKeys';
import { User } from 'types/models/user';

/**
 * Hook to check if the user is authenticated
 *
 * @param options React Query options
 */
export const useIsAuthenticated = (options?: Partial<UseQueryOptions<boolean, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.isAuthenticated],
    queryFn: async () => {
      try {
        // Try to get current user - if successful, user is authenticated
        // Pass true to suppress error logging for auth checks
        const user = await userService.getCurrentUser(true);
        message.success(`Bienvenid@ de vuelta, ${user.firstName}${user.spouseFirstName ? ' y ' + user.spouseFirstName : ''}!`);
        return true;
      } catch (error) {
        // If getCurrentUser fails, user is not authenticated
        // This is expected behavior, so we don't log it as an error
        return false;
      }
    },
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch the current authenticated user
 *
 * @param options React Query options
 */
export const useCurrentUser = (options?: Partial<UseQueryOptions<User, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.currentUser],
    queryFn: async () => {
      try {
        // Pass true to suppress error logging for auth checks
        return await userService.getCurrentUser(true);
      } catch (error) {
        // Suppress error logging for unauthenticated users
        // This is expected when user is not logged in
        throw error;
      }
    },
    retry: false, // Don't retry on auth failures
    ...options,
  });
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
export const useGetUserBySlug = (coupleSlug: string | undefined) => {
  return useQuery({
    queryKey: [queryKeys.userBySlug, coupleSlug],
    queryFn: () => userService.getBySlug(coupleSlug!),
    enabled: !!coupleSlug,
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
      // After login, we should refresh the current user data
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.isAuthenticated] });
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
      // Clear all user-related data from cache
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.isAuthenticated] });
      // Remove the cached data immediately
      queryClient.removeQueries({ queryKey: [queryKeys.currentUser] });
      queryClient.removeQueries({ queryKey: [queryKeys.isAuthenticated] });
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
      coupleSlug?: string;
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
