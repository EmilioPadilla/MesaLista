import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from 'services/user.service';
import { useCurrentUser } from 'hooks/useUser';
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
      await userService.logout();
    } finally {
      await tokenStore.clear();
      // Drop any in-flight requests first so a late /users/me response can't
      // land after we seed the logged-out state and resurrect the session.
      await queryClient.cancelQueries();
      queryClient.clear();
      // Seed a definitive logged-out state. If we only removed the query, the
      // active useCurrentUser observer would immediately refetch /users/me,
      // flipping isLoading back to true and making the (app) guard render its
      // spinner instead of redirecting to /login (swallowing the navigation).
      // Writing null keeps isAuthenticated false and isLoading false, so the
      // guard redirects cleanly.
      queryClient.setQueryData([queryKeys.currentUser], null);
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
