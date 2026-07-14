import { useMutation } from '@tanstack/react-query';
import { pushService, type RegisterPushTokenPayload } from '../services/push.service';

/**
 * Register (upsert) the current device's Expo push token for the authenticated user.
 */
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (payload: RegisterPushTokenPayload) => pushService.register(payload),
  });
};

/**
 * Unregister the current device's Expo push token (on logout).
 */
export const useUnregisterPushToken = () => {
  return useMutation({
    mutationFn: (token: string) => pushService.unregister(token),
  });
};
