import apiClient from './client';
import { pushEndpoints } from './push.endpoints';

export interface RegisterPushTokenPayload {
  token: string;
  platform?: string;
  deviceId?: string;
}

export const pushService = {
  /** Register (upsert) the current device's Expo push token for the authenticated user. */
  register: async (payload: RegisterPushTokenPayload): Promise<void> => {
    await apiClient.post(pushEndpoints.register, payload);
  },

  /** Unregister the current device's Expo push token (on logout). */
  unregister: async (token: string): Promise<void> => {
    await apiClient.post(pushEndpoints.unregister, { token });
  },
};

export default pushService;
