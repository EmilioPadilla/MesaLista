import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// PublicRegistry is just a shell around the slug lookup, so stub the nav and the
// SEO head and drive the one hook that decides what the shell renders.
const useGiftListBySlug = vi.fn();

vi.mock('src/hooks/useGiftList', () => ({
  useGiftListBySlug: (...args: unknown[]) => useGiftListBySlug(...args),
}));

vi.mock('src/app/modules/navigation/topnav/TopNav', () => ({ TopNav: () => null }));

vi.mock('src/components/seo', () => ({ PageSEO: () => null }));

import PublicRegistry from './PublicRegistry';

const notFound = (status: number) => ({
  data: undefined,
  isError: true,
  error: { response: { status } },
  refetch: vi.fn(),
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:slug" element={<PublicRegistry />}>
          <Route index element={<div>contenido de la mesa</div>} />
          <Route path="regalos" element={<div>contenido de la mesa</div>} />
          <Route path="crear-lista" element={<div>contenido de la mesa</div>} />
          <Route path="pago-confirmado" element={<div>confirmación de pago</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('PublicRegistry — registry that is not published', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGiftListBySlug.mockReturnValue(notFound(404));
  });

  it('shows the not-found screen instead of the gift list', () => {
    renderAt('/sol-y-emilio/regalos');

    expect(screen.getByText(/Mesa de regalos/)).toBeInTheDocument();
    expect(screen.getByText(/no encontrada/)).toBeInTheDocument();
    expect(screen.queryByText('contenido de la mesa')).not.toBeInTheDocument();
  });

  it('echoes the slug back so a mistyped link is easy to spot', () => {
    renderAt('/sol-y-emilio');

    expect(screen.getByText('sol-y-emilio')).toBeInTheDocument();
  });

  it('says nothing about the registry existing as a draft', () => {
    renderAt('/sol-y-emilio/regalos');

    // A guest must not be able to tell a draft apart from a slug nobody owns.
    expect(screen.queryByText(/borrador/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/publicad[ao] todavía|sin publicar/i)).not.toBeInTheDocument();
  });

  it('still renders owner routes, so a couple with no list can create one', () => {
    renderAt('/sol-y-emilio/crear-lista');

    expect(screen.getByText('contenido de la mesa')).toBeInTheDocument();
  });

  it('leaves a list addressed by ?listId= to the page that resolves it', () => {
    renderAt('/sol-y-emilio/regalos?listId=42');

    expect(screen.getByText('contenido de la mesa')).toBeInTheDocument();
  });

  it('offers a retry when the request failed rather than 404ed', () => {
    useGiftListBySlug.mockReturnValue(notFound(500));
    renderAt('/sol-y-emilio/regalos');

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  // OrderConfirmation is what captures a PayPal payment, from an effect that only
  // runs if it mounts. Replacing it with the not-found screen would leave an
  // approved order uncaptured while the guest believes they paid, so it has to
  // render no matter what the slug lookup did.
  it('still renders the payment confirmation when the slug lookup 404s', () => {
    renderAt('/sol-y-emilio/pago-confirmado?cartId=abc');

    expect(screen.getByText('confirmación de pago')).toBeInTheDocument();
    expect(screen.queryByText(/no encontrada/)).not.toBeInTheDocument();
  });

  it('still renders the payment confirmation when the slug lookup errors', () => {
    useGiftListBySlug.mockReturnValue(notFound(500));
    renderAt('/sol-y-emilio/pago-confirmado?cartId=abc&token=5V1&PayerID=ABC');

    expect(screen.getByText('confirmación de pago')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});
