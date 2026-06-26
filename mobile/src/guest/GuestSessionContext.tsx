import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { guestIdStore } from './guestSession';

interface GuestSessionValue {
  /** Stable anonymous id scoping the guest's server-side cart. Null until loaded. */
  guestId: string | null;
  /** Mint a fresh guest id (called after a successful purchase to start a clean cart). */
  regenerateGuestId: () => void;
}

const GuestSessionContext = createContext<GuestSessionValue | null>(null);

/**
 * Provides the anonymous guest id used by the cart/checkout flow. Mirrors the
 * web's `PublicRegistry` guest-id management, persisted via {@link guestIdStore}.
 */
export function GuestSessionProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    guestIdStore.getOrCreate().then((id) => {
      if (active) setGuestId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const regenerateGuestId = useCallback(() => {
    guestIdStore.regenerate().then((id) => setGuestId(id));
  }, []);

  const value = useMemo<GuestSessionValue>(() => ({ guestId, regenerateGuestId }), [guestId, regenerateGuestId]);

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession(): GuestSessionValue {
  const ctx = useContext(GuestSessionContext);
  if (!ctx) throw new Error('useGuestSession must be used within a GuestSessionProvider');
  return ctx;
}
