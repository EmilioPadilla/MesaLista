import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { message } from 'antd';
import type { User } from '@prisma/client';
import { userService } from '../services/user.service';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch the current authenticated user
 *
 * @param options React Query options
 */
export const useCurrentUser = (options?: Partial<UseQueryOptions<User, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.currentUser],
    queryFn: () => userService.getCurrentUser(),
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
 * Hook to login a user
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => userService.login(email, password),
    onSuccess: () => {
      // After login, we should refresh the current user data
      queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
    },
    onError: (error) => {
      console.error('Login error:', error);
      message.error('Error al iniciar sesión. Por favor verifica tus credenciales.');
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
 * Hook to update an existing user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => userService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users, variables.id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });

      // If the updated user is the current user, also invalidate currentUser
      const currentUser = queryClient.getQueryData<User>([queryKeys.currentUser]);
      if (currentUser && currentUser.id === variables.id) {
        queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      }
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
