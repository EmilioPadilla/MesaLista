import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PurchasedGift } from 'src/services/payment.service';

// Behaviour pinned by this suite:
//   1. Long messages render inline with an expandable "Ver más" affordance so
//      couples can read the whole note without copy-pasting.
//   2. A "Descargar recuerdos" button produces a CSV with only the keepsake-worthy
//      columns (gift, guest, message, etc.) — no email leakage.

const mockData: { data: PurchasedGift[] } | null = {
  data: [
    {
      id: 1,
      giftTitle: 'Juego de sábanas',
      guestName: 'María López',
      guestEmail: 'maria@example.com',
      message:
        'Felicidades a los novios, este regalo es para que tengan unas noches muy cómodas durante muchos años. Con todo nuestro cariño.',
      quantity: 1,
      price: 1500,
      totalPrice: 1500,
      categories: 'Hogar',
      paymentType: 'STRIPE',
      paymentDate: '2026-04-12T10:00:00.000Z',
      currency: 'MXN',
      rsvpInvitee: { firstName: 'María', lastName: 'López', status: 'CONFIRMED' },
    },
    {
      id: 2,
      giftTitle: 'Licuadora',
      guestName: 'José García',
      guestEmail: 'jose@example.com',
      message: '',
      quantity: 1,
      price: 800,
      totalPrice: 800,
      categories: 'Cocina',
      paymentType: 'PAYPAL',
      paymentDate: '2026-04-13T10:00:00.000Z',
      currency: 'MXN',
      rsvpInvitee: null,
    },
  ],
};

let mockState: { data: typeof mockData | null; isLoading: boolean; error: any } = {
  data: mockData,
  isLoading: false,
  error: null,
};

vi.mock('src/hooks/usePayment', () => ({
  usePurchasedGiftsByWeddingList: () => mockState,
}));

vi.mock('src/hooks/useDeviceType', () => ({
  useDeviceType: () => 'desktop',
}));

const { PurchasedGiftsTab } = await import('./PurchasedGiftsTab');

beforeEach(() => {
  mockState = { data: mockData, isLoading: false, error: null };
});

describe('PurchasedGiftsTab — message visibility', () => {
  it('renders the full guest message text in the row (expand affordance is visual-only)', () => {
    render(<PurchasedGiftsTab weddingListId={1} />);
    // The whole note is in the DOM — antd's <Paragraph ellipsis> truncates with CSS,
    // not by stripping text, so the keepsake content is always available to readers.
    expect(screen.getByText(/felicidades a los novios/i)).toBeInTheDocument();
    expect(screen.getByText(/con todo nuestro cariño/i)).toBeInTheDocument();
  });

  it('renders "Sin mensaje" for rows without a guest message', () => {
    render(<PurchasedGiftsTab weddingListId={1} />);
    expect(screen.getByText(/sin mensaje/i)).toBeInTheDocument();
  });

  it('wraps the message in an ellipsis-capable Paragraph so long notes truncate inline', () => {
    const { container } = render(<PurchasedGiftsTab weddingListId={1} />);
    // The presence of the ellipsis class is the contract with antd that the row
    // will collapse long notes and expose a "Ver más" affordance once the cell
    // measures overflow at real layout time.
    expect(container.querySelectorAll('.ant-typography-ellipsis').length).toBeGreaterThan(0);
  });
});

describe('PurchasedGiftsTab — keepsake download', () => {
  it('exposes a "Descargar recuerdos" button when there are purchases', () => {
    render(<PurchasedGiftsTab weddingListId={1} />);
    expect(screen.getByRole('button', { name: /descargar recuerdos/i })).toBeInTheDocument();
  });

  it('produces a CSV blob and triggers a download with the keepsake filename', () => {
    const blobInstances: { type: string; content: string }[] = [];
    const originalBlob = global.Blob;
    // Spy on Blob construction so we can assert on the payload that hit the download.
    (global as any).Blob = function (this: any, parts: any[], options: any) {
      blobInstances.push({ type: options?.type ?? '', content: parts.join('') });
      return new originalBlob(parts, options);
    } as any;

    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    (global.URL as any).createObjectURL = createObjectURL;
    (global.URL as any).revokeObjectURL = revokeObjectURL;

    const anchorClicks: HTMLAnchorElement[] = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        anchorClicks.push(el as HTMLAnchorElement);
        // Intercept the synthesised click to keep jsdom from navigating.
        (el as HTMLAnchorElement).click = vi.fn();
      }
      return el;
    });

    render(<PurchasedGiftsTab weddingListId={1} />);
    // Render produces antd's own anchors (pagination etc.); track only the one the
    // download handler creates after the click.
    const anchorsBeforeClick = anchorClicks.length;
    fireEvent.click(screen.getByRole('button', { name: /descargar recuerdos/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(blobInstances.length).toBe(1);
    expect(blobInstances[0].type).toContain('text/csv');
    // The CSV must contain a header and both purchases — the keepsake is useless
    // if rows go missing.
    expect(blobInstances[0].content).toContain('Regalo');
    expect(blobInstances[0].content).toContain('Juego de sábanas');
    expect(blobInstances[0].content).toContain('Licuadora');
    // And it MUST NOT leak the guest email — this is a memento, not a contact list.
    expect(blobInstances[0].content).not.toContain('maria@example.com');

    const downloadAnchors = anchorClicks.slice(anchorsBeforeClick);
    expect(downloadAnchors.length).toBe(1);
    const anchor = downloadAnchors[0];
    // The anchor must have been programmatically clicked to trigger the download —
    // creating it and never clicking would silently no-op the export.
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(anchor.download).toMatch(/^recuerdos-regalos-\d{4}-\d{2}-\d{2}\.csv$/);
    // The blob URL must be released after the click — otherwise we leak memory in
    // the long-lived dashboard SPA every time a couple downloads their keepsake.
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    (global as any).Blob = originalBlob;
  });
});

describe('PurchasedGiftsTab — empty / loading / error states', () => {
  it('renders the empty state when there are no purchases', () => {
    mockState = { data: { data: [] }, isLoading: false, error: null };
    render(<PurchasedGiftsTab weddingListId={1} />);
    expect(screen.getByText(/aún no hay regalos comprados/i)).toBeInTheDocument();
    // No download button should appear when there is nothing to keep.
    expect(screen.queryByRole('button', { name: /descargar recuerdos/i })).not.toBeInTheDocument();
  });

  it('renders an error state when the query fails', () => {
    mockState = { data: null, isLoading: false, error: new Error('boom') };
    render(<PurchasedGiftsTab weddingListId={1} />);
    expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
  });
});
