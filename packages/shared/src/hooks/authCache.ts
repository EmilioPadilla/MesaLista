import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Resets the query cache to a definitive logged-out state.
 *
 * Do NOT use `queryClient.clear()` for this while a `useCurrentUser` observer
 * is mounted (the mobile AuthProvider keeps one mounted for the app's whole
 * lifetime). `QueryCache.remove()` destroys the query but never detaches its
 * observers, so after `clear()` the still-mounted observer keeps reporting the
 * last signed-in user while a follow-up `setQueryData(..., null)` writes into
 * a brand-new query instance nobody is watching. The app then still believes
 * it is authenticated: the welcome screen bounces straight back into the
 * authenticated group with an empty cache behind it.
 *
 * Instead, write `null` into the EXISTING currentUser query — which notifies
 * every mounted observer — and then drop all other queries. Seeding `null`
 * (rather than removing the query) also keeps `isLoading` false so auth
 * guards redirect instead of rendering their spinner, and the fresh
 * `dataUpdatedAt` prevents an immediate /users/me refetch from resurrecting
 * the session.
 */
export async function seedLoggedOutCache(queryClient: QueryClient): Promise<void> {
  // Drop in-flight requests first so a late /users/me response can't land
  // after we seed the logged-out state.
  await queryClient.cancelQueries();
  queryClient.setQueryData([queryKeys.currentUser], null);
  // Note: mutations are deliberately left alone — this helper runs inside
  // useDeleteCurrentUser's own onSuccess, and clearing the mutation cache
  // there would remove the running mutation mid-callback.
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.currentUser });
}
