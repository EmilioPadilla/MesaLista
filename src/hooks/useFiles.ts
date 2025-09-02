import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { fileService } from 'services/files.service';

/**
 * Hook to fetch the current user's cart
 *
 * @param options React Query options
 */
export const useUploadFile = (options?: Partial<UseMutationOptions<any, Error, File>>) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};
  return useMutation({
    mutationFn: (file: File) => fileService.uploadFile(file),
    onSuccess: (data, variables, context) => {
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
      queryClient.invalidateQueries({ queryKey: [queryKeys.uploadFile] });
    },
    ...restOptions,
  });
};
