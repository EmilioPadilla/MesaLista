import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import discountCodeService, {
  DiscountCode,
  DiscountCodeWithUsers,
  CreateDiscountCodeRequest,
  UpdateDiscountCodeRequest,
  ValidateDiscountCodeResponse,
} from '../services/discountCode.service';
import { queryKeys } from './queryKeys';

// Public hook - Validate discount code with debouncing
export const useValidateDiscountCode = (code: string, debounceMs: number = 1000) => {
  const [debouncedCode, setDebouncedCode] = useState('');

  // Debounce the code input
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only set debounced code if it has more than 3 characters
      if (code && code.length > 3) {
        setDebouncedCode(code);
      } else {
        setDebouncedCode('');
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [code, debounceMs]);

  return useQuery<ValidateDiscountCodeResponse, Error>({
    queryKey: [queryKeys.discountCodes, 'validate', debouncedCode],
    queryFn: () => discountCodeService.validateDiscountCode(debouncedCode),
    enabled: !!debouncedCode,
    retry: false, // Don't retry on validation failure
  });
};

// Admin hooks
export const useDiscountCodes = () => {
  return useQuery<DiscountCode[], Error>({
    queryKey: [queryKeys.discountCodes, 'admin'],
    queryFn: () => discountCodeService.getAllDiscountCodes(),
  });
};

export const useDiscountCodeStats = (id: number) => {
  return useQuery<DiscountCodeWithUsers, Error>({
    queryKey: [queryKeys.discountCodes, 'stats', id],
    queryFn: () => discountCodeService.getDiscountCodeStats(id),
    enabled: !!id,
  });
};

export const useCreateDiscountCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiscountCodeRequest) => discountCodeService.createDiscountCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountCodes, 'admin'] });
    },
  });
};

export const useUpdateDiscountCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDiscountCodeRequest }) => discountCodeService.updateDiscountCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountCodes, 'admin'] });
    },
  });
};

export const useDeleteDiscountCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discountCodeService.deleteDiscountCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountCodes, 'admin'] });
    },
  });
};
