import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import emailService, {
  SendVerificationCodeRequest,
  SendVerificationCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  CheckVerificationStatusResponse,
} from 'services/email.service';

/**
 * Hook to send verification code to email
 */
export const useSendVerificationCode = (
  options?: Partial<UseMutationOptions<SendVerificationCodeResponse, Error, SendVerificationCodeRequest>>,
) => {
  return useMutation({
    mutationFn: (data: SendVerificationCodeRequest) => emailService.sendVerificationCode(data),
    ...options,
  });
};

/**
 * Hook to verify email with code
 */
export const useVerifyCode = (options?: Partial<UseMutationOptions<VerifyCodeResponse, Error, VerifyCodeRequest>>) => {
  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => emailService.verifyCode(data),
    ...options,
  });
};

/**
 * Hook to check if email was recently verified
 */
export const useCheckVerificationStatus = (
  email: string,
  options?: Partial<UseQueryOptions<CheckVerificationStatusResponse, Error>>,
) => {
  return useQuery({
    queryKey: ['emailVerification', 'status', email],
    queryFn: () => emailService.checkVerificationStatus(email),
    enabled: !!email && email.length > 0,
    ...options,
  });
};
