import { useEffect } from 'react';

import { useGetCart } from 'hooks/useCart';

import { useGuestSession } from './GuestSessionContext';

/**
 * The guest's active cart, keyed by their persisted guest id.
 *
 * Self-heals a stale session: the server refuses to mutate a cart once it
 * leaves PENDING (paid, cancelled), and normally OrderConfirmationScreen mints
 * a fresh guest id after payment. But if the app never reaches that screen —
 * e.g. the payment succeeded and the redirect back to the app failed — the
 * persisted guest id keeps pointing at the PAID cart forever: items can't be
 * removed, added, or paid again. When that state is detected here, the guest
 * id is rotated so the next fetch creates a clean PENDING cart.
 *
 * Screens that must read a non-PENDING cart (OrderConfirmationScreen polls the
 * paid cart by its session to show the receipt) should keep using `useGetCart`
 * directly with the cart's session, never this hook.
 */
export function useGuestCart() {
  const { guestId, regenerateGuestId } = useGuestSession();
  const query = useGetCart(guestId || undefined);

  const status = (query.data as { status?: string } | undefined)?.status;
  useEffect(() => {
    if (guestId && status && status !== 'PENDING') {
      regenerateGuestId(guestId);
    }
  }, [guestId, status, regenerateGuestId]);

  return { ...query, guestId };
}
