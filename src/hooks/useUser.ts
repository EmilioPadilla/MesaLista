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
        const user = await userService.getCurrentUser();
        message.success(`Bienvenid@ de vuelta, ${user.firstName}${user.spouseFirstName ? ' y ' + user.spouseFirstName : ''}!`);
        return true;
      } catch (error) {
        // If getCurrentUser fails, user is not authenticated
        return false;
      }
    },
    retry: 1,
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
    queryFn: () => userService.getCurrentUser(),
    retry: 2,
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
    logout: () => {
      userService.logout();
      // Clear user data from cache
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
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
 * Hook to delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
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
