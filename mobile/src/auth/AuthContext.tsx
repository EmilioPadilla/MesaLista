import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from 'services/user.service';
import { pushService } from 'services/push.service';
import { push } from 'platform/push';
import { useCurrentUser } from 'hooks/useUser';
import { seedLoggedOutCache } from 'hooks/authCache';
import { queryKeys } from 'hooks/queryKeys';
import type { User } from 'types/models/user';
import { tokenStore } from '@/lib/secureStore';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth state for the mobile app. Reuses the shared useCurrentUser query and
 * userService, adding device-side token persistence (the web's HttpOnly cookie
 * equivalent): the session token is stored in expo-secure-store and attached as
 * a Bearer header by the fetch client.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await userService.login(email, password);
      if (result.token) {
        await tokenStore.set(result.token);
      }
      // Refetch /users/me now that the token is stored.
      await queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      return result;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      // Unregister this device's push token while the session is still valid
      // (the endpoint is authenticated). Never block logout on a push failure.
      try {
        const token = await push.getExpoPushToken();
        if (token) await pushService.unregister(token);
      } catch (pushError) {
        console.warn('Failed to unregister push token on logout:', pushError);
      }
      await userService.logout();
    } finally {
      await tokenStore.clear();
      // Seed a definitive logged-out state. This must NOT go through
      // queryClient.clear(): our own useCurrentUser observer stays mounted,
      // and clear() detaches it from the cache without notifying it, so it
      // would keep reporting the old user and the welcome screen would bounce
      // straight back to /(app). See seedLoggedOutCache.
      await seedLoggedOutCache(queryClient);
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
