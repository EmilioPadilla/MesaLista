import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { seedLoggedOutCache } from './authCache';
import { useCurrentUser } from './useUser';
import { queryKeys } from './queryKeys';

vi.mock('../services/user.service', () => ({
  userService: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../platform/notify', () => ({
  notify: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const mockUser = { id: 1, firstName: 'Emilio', email: 'e@example.com', role: 'USER' };

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('seedLoggedOutCache', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createClient();
  });

  it('notifies an already-mounted useCurrentUser observer that the session ended', async () => {
    // The mobile AuthProvider keeps a useCurrentUser observer mounted for the
    // app's whole lifetime. Regression: queryClient.clear() + setQueryData
    // left that observer attached to the destroyed query, so it kept
    // reporting the old user and the welcome screen bounced back to /(app).
    queryClient.setQueryData([queryKeys.currentUser], mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.data).toEqual(mockUser));

    await seedLoggedOutCache(queryClient);

    // The MOUNTED observer must see the logged-out state — not just fresh
    // cache reads. This is the assertion that fails with clear().
    await waitFor(() => expect(result.current.data).toBeNull());
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps isLoading false so auth guards redirect instead of spinning', async () => {
    queryClient.setQueryData([queryKeys.currentUser], mockUser);
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.data).toEqual(mockUser));

    await seedLoggedOutCache(queryClient);
    await waitFor(() => expect(result.current.data).toBeNull());

    // A removed (rather than nulled) query would flip isLoading back to true
    // on refetch, making the (app) guard render its spinner and swallow the
    // redirect to /welcome.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it('does not trigger an immediate /users/me refetch that could resurrect the session', async () => {
    const { userService } = await import('../services/user.service');
    queryClient.setQueryData([queryKeys.currentUser], mockUser);
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.data).toEqual(mockUser));

    await seedLoggedOutCache(queryClient);
    await waitFor(() => expect(result.current.data).toBeNull());

    // Flush a tick: no background refetch should have been started.
    await new Promise((r) => setTimeout(r, 0));
    expect(userService.getCurrentUser).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('removes every non-currentUser query from the cache', async () => {
    queryClient.setQueryData([queryKeys.currentUser], mockUser);
    queryClient.setQueryData([queryKeys.giftListsByUser, 1], [{ id: 10 }]);
    queryClient.setQueryData([queryKeys.cart], { items: [1, 2] });

    await seedLoggedOutCache(queryClient);

    expect(queryClient.getQueryData([queryKeys.giftListsByUser, 1])).toBeUndefined();
    expect(queryClient.getQueryData([queryKeys.cart])).toBeUndefined();
    expect(queryClient.getQueryData([queryKeys.currentUser])).toBeNull();
  });

  it('cancels an in-flight /users/me request so a late response cannot resurrect the session', async () => {
    const { userService } = await import('../services/user.service');
    let resolveFetch!: (u: typeof mockUser) => void;
    vi.mocked(userService.getCurrentUser).mockImplementation(
      () => new Promise((resolve) => (resolveFetch = resolve)) as any,
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isFetching).toBe(true));

    await seedLoggedOutCache(queryClient);
    resolveFetch(mockUser); // late response lands after logout
    await new Promise((r) => setTimeout(r, 0));

    await waitFor(() => expect(result.current.data).toBeNull());
    expect(queryClient.getQueryData([queryKeys.currentUser])).toBeNull();
  });
});
