import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import signupEmailService, { SignupEmailsResponse, SignupEmailResponse } from '../services/signupEmail.service';

/**
 * Hook to get all signup emails (admin only)
 */
export const useSignupEmails = () => {
  return useQuery<SignupEmailsResponse, Error>({
    queryKey: ['signupEmails'],
    queryFn: () => signupEmailService.getAll(),
  });
};

/**
 * Hook to save email from signup attempt (public)
 */
export const useSaveSignupEmail = () => {
  return useMutation<SignupEmailResponse, Error, { email: string; firstName?: string; lastName?: string; phone?: string }>({
    mutationFn: (data) => signupEmailService.saveFromSignup(data),
  });
};

/**
 * Hook to add email manually (admin only)
 */
export const useAddManualSignupEmail = () => {
  const queryClient = useQueryClient();
  return useMutation<SignupEmailResponse, Error, { email: string; firstName?: string; lastName?: string }>({
    mutationFn: (data) => signupEmailService.addManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signupEmails'] });
    },
  });
};

/**
 * Hook to delete a signup email (admin only)
 */
export const useDeleteSignupEmail = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, number>({
    mutationFn: (id) => signupEmailService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signupEmails'] });
    },
  });
};
