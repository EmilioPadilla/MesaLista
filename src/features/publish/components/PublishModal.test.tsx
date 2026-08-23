import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// The modal pulls in payment, discount and analytics hooks it doesn't need for
// the visibility choice, so stub them all to a quiescent state.
const publishGiftList = vi.fn().mockResolvedValue({});
const updateGiftList = vi.fn().mockResolvedValue({});
const createPlanCheckout = vi.fn().mockResolvedValue({ success: false });

vi.mock('src/hooks/useGiftList', () => ({
  usePublishGiftList: () => ({ mutateAsync: publishGiftList, isPending: false }),
  useUpdateGiftList: () => ({ mutateAsync: updateGiftList, isPending: false }),
}));

vi.mock('src/hooks/usePayment', () => ({
  useCreatePlanCheckoutSession: () => ({ mutateAsync: createPlanCheckout }),
}));

vi.mock('src/hooks/useDiscountCode', () => ({
  useValidateDiscountCode: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock('src/hooks/useAnalyticsTracking', () => ({
  useTrackEvent: () => vi.fn(),
}));

import { PublishModal } from './PublishModal';

const renderModal = () => render(<PublishModal open onClose={vi.fn()} giftListId={7} />);

const checkbox = () => screen.getByRole('checkbox', { name: /búsqueda pública/i });

describe('PublishModal visibility choice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers the search visibility choice, checked by default', () => {
    renderModal();

    expect(checkbox()).toBeChecked();
    expect(screen.getByText(/puedes cambiarlo cuando quieras desde configuración/i)).toBeInTheDocument();
  });

  it('applies the visibility choice before publishing on commission', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /publicar gratis/i }));

    await waitFor(() => expect(publishGiftList).toHaveBeenCalledWith(7));
    expect(updateGiftList).toHaveBeenCalledWith({ id: 7, data: { isPublic: true } });
    // Order matters: a list must never be live with the wrong visibility, even briefly.
    expect(updateGiftList.mock.invocationCallOrder[0]).toBeLessThan(publishGiftList.mock.invocationCallOrder[0]);
  });

  it('keeps the registry out of search when the couple unchecks it', async () => {
    renderModal();

    fireEvent.click(checkbox());
    expect(checkbox()).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /publicar gratis/i }));

    await waitFor(() => expect(updateGiftList).toHaveBeenCalledWith({ id: 7, data: { isPublic: false } }));
  });

  it('applies the visibility choice before sending the couple to fixed-plan checkout', async () => {
    renderModal();

    fireEvent.click(checkbox());
    fireEvent.click(screen.getByRole('button', { name: /pagar y publicar/i }));

    await waitFor(() => expect(createPlanCheckout).toHaveBeenCalled());
    // The fixed plan publishes server-side from the Stripe webhook, so the draft
    // has to carry the choice before the couple leaves for checkout.
    expect(updateGiftList).toHaveBeenCalledWith({ id: 7, data: { isPublic: false } });
    expect(updateGiftList.mock.invocationCallOrder[0]).toBeLessThan(createPlanCheckout.mock.invocationCallOrder[0]);
  });
});
