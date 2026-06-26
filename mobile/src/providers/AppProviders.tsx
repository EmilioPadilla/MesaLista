import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerApiClient } from '@/lib/httpClient';
import { ToastProvider } from '@/lib/ToastProvider';
import { AuthProvider } from '@/auth/AuthContext';
import { GuestSessionProvider } from '@/guest/GuestSessionContext';

// Register the fetch-based API client as the spine's apiClient before any
// service call. Runs once at module load.
registerApiClient();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 60 * 1000 },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <GuestSessionProvider>{children}</GuestSessionProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
