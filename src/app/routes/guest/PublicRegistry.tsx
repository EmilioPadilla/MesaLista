import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { EyeOff } from 'lucide-react';
import { useGiftListBySlug } from 'src/hooks/useGiftList';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { TopNavWrapper } from 'src/app/modules/navigation/topnav/TopNavWrapper';
import { RegistryNotFound } from './RegistryNotFound';

/**
 * Sub-routes under /:slug that must render even when the slug lookup fails.
 *
 * Two different reasons land a route in here, and both matter:
 *
 *   The couple's own pages — a brand-new owner whose slug resolves to nothing a
 *   guest can see is exactly the state you are in before your first list exists,
 *   and blocking these would lock them out of creating one.
 *
 *   `pago-confirmado` — NOT cosmetic. OrderConfirmation is what captures a PayPal
 *   payment: it reads `token`/`PayerID` off the return URL and calls the capture
 *   endpoint from a mount effect. Swapping it for the not-found page means the
 *   effect never runs, so an approved PayPal order is never captured — no money
 *   moves, no Payment row, no email — while the guest believes they paid. It
 *   needs nothing from the slug lookup either: it resolves its cart from
 *   `?cartId=`. Do not remove it on the grounds that it isn't an owner page.
 */
const SLUG_INDEPENDENT_SUBROUTES = new Set([
  'listas',
  'crear-lista',
  'gestionar',
  'invitacion',
  'gestionar-rsvp',
  'configuracion',
  'pago-confirmado',
]);

// Utility for guest ID management
function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

// Utility to regenerate guest ID
function regenerateGuestId() {
  const newGuestId = uuidv4();
  localStorage.setItem('guestId', newGuestId);
  return newGuestId;
}

export type OutletContextType = {
  guestId: string | null;
  slug: string | undefined;
  regenerateGuestId: () => void;
};

export default function PublicRegistry() {
  const { slug } = useParams();
  const { pathname, search } = useLocation();
  const [guestId, setGuestId] = useState<string | null>(null);

  // The server 404s an unpublished list for everyone but its owner, so getting a
  // draft back here means the couple is previewing their own work in progress.
  const { data: giftList, error, isError, refetch } = useGiftListBySlug(slug);
  const isOwnerPreviewingDraft = !!giftList && !giftList.publishedAt;

  // A draft, a closed account and a slug nobody owns all arrive here as the same
  // 404, and they must stay indistinguishable — telling a guest "this exists but
  // isn't published" leaks the couple's work in progress.
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  const subRoute = pathname.split('/').filter(Boolean)[1] ?? '';
  // `?listId=` addresses a specific list by id, which BuyGiftsPage resolves on its
  // own; the slug lookup failing says nothing about whether that list is viewable.
  const hasListIdOverride = new URLSearchParams(search).has('listId');
  const blockGuestView = isError && !SLUG_INDEPENDENT_SUBROUTES.has(subRoute) && !hasListIdOverride;

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  const handleRegenerateGuestId = useCallback(() => {
    const newGuestId = regenerateGuestId();
    setGuestId(newGuestId);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <TopNav slug={slug} />
        <TopNavWrapper>
          {/* Sticky, not fixed: the nav owns the top 4rem, so the banner sits just under it and stays put while scrolling. */}
          {isOwnerPreviewingDraft && (
            <div className="sticky top-16 z-40 bg-[#d4704a] px-4 py-2.5 text-center text-sm font-medium text-white print:hidden">
              <EyeOff className="mr-2 inline h-4 w-4" />
              Vista previa — tu mesa no está publicada y tus invitados todavía no pueden verla.
            </div>
          )}
          <Content>
            {blockGuestView ? (
              <RegistryNotFound slug={slug} variant={status === 404 ? 'not-found' : 'error'} onRetry={() => refetch()} />
            ) : (
              /* Child routes will be rendered here */
              <Outlet context={{ guestId, slug, regenerateGuestId: handleRegenerateGuestId }} />
            )}
          </Content>
        </TopNavWrapper>
        {/* <Footer className="text-center">MesaLista {new Date().getFullYear()} - Tu plataforma para listas de regalos de boda</Footer> */}
      </Layout>
    </Layout>
  );
}
