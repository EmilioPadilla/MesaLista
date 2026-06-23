import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { fileService } from 'services/files.service';

/**
 * Hook to fetch the current user's cart
 *
 * @param options React Query options
 */
export const useUploadFile = (options?: Partial<UseMutationOptions<any, Error, File>>) => {
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: (file: File) => fileService.uploadFile(file),
    onSuccess: (data, variables, context, options) => {
      if (onSuccess) {
        onSuccess(data, variables, context, options);
      }
    },
    ...restOptions,
  });
};
