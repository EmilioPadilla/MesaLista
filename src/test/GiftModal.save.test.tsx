import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GiftItem } from 'src/app/routes/couple/ManageRegistry';

// Regression coverage for the "I just delete and recreate the gift" feedback. The
// modal had two silent edit failures that this suite locks in place:
//   1. Clearing every category never made it to the controller — the legacy code
//      sent no `categories` field when the array was empty, so the backend left the
//      old tags. Now the array is always emitted.
//   2. Clicking X to drop the image fell back to the original URL — `imageState.url`
//      was emptied but the save read `imageState.url || gift.imageUrl`. Now an
//      explicit `imageRemoved` flag forces `imageUrl: ''` on the wire, which the
//      controller coerces to null.

const updateGiftMutate = vi.fn();
const uploadFileMutate = vi.fn();
const isUpdateError = false;

vi.mock('hooks/useGift', () => ({
  useUpdateGift: () => ({
    mutate: updateGiftMutate,
    isSuccess: false,
    isError: isUpdateError,
  }),
}));

vi.mock('hooks/useFiles', () => ({
  useUploadFile: () => ({
    mutate: uploadFileMutate,
  }),
}));

vi.mock('src/hooks/useGiftList', () => ({
  useGetCategoriesByGiftList: () => ({
    data: { categories: [{ name: 'Hogar' }, { name: 'Cocina' }] },
  }),
}));

// antd Message uses a portal we don't need to assert on here; suppressing keeps the
// jsdom console clean and the act() warnings down.
vi.mock('antd', async () => {
  const actual: any = await vi.importActual('antd');
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  };
});

const { GiftModal } = await import('src/features/manageRegistry/components/GiftModal');

const baseGift: GiftItem = {
  id: 42,
  title: 'Juego de sábanas',
  description: 'Descripción original',
  price: 1500,
  imageUrl: 'https://cdn.example/old.jpg',
  imagePosition: 50,
  imageScale: 100,
  isPurchased: false,
  isMostWanted: false,
  giftListId: 1,
  quantity: 1,
  categories: [
    { id: 10, name: 'Hogar', createdAt: new Date(), updatedAt: new Date() },
    { id: 11, name: 'Cocina', createdAt: new Date(), updatedAt: new Date() },
  ],
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  updateGiftMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
});

const renderModal = (overrides: Partial<React.ComponentProps<typeof GiftModal>> = {}) => {
  const onClose = vi.fn();
  const onGiftSaved = vi.fn();
  render(
    <GiftModal
      gift={baseGift}
      isOpen
      onClose={onClose}
      onGiftSaved={onGiftSaved}
      weddingListId={1}
      {...overrides}
    />,
  );
  return { onClose, onGiftSaved };
};

const submit = () => {
  const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
  fireEvent.click(saveBtn);
};

describe('GiftModal save behaviour', () => {
  it('emits the full updated gift with no image change as a passthrough', async () => {
    renderModal();

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    const [args] = updateGiftMutate.mock.calls[0];
    expect(args.id).toBe(42);
    expect(args.data.title).toBe('Juego de sábanas');
    expect(args.data.price).toBe(1500);
    expect(args.data.imageUrl).toBe('https://cdn.example/old.jpg');
    // The previous-tags survive when the user opens & saves without touching them.
    expect(args.data.categories).toHaveLength(2);
    expect(args.data.categories[0]).toMatchObject({ name: 'Hogar' });
  });

  it('emits an empty categories array when the user clears every tag (regression)', async () => {
    renderModal();

    // Each .ant-select-selection-item has its remove icon — click them all to clear.
    const removeIcons = document.querySelectorAll('.ant-select-selection-item-remove');
    expect(removeIcons.length).toBeGreaterThan(0);
    removeIcons.forEach((icon) => fireEvent.click(icon));

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    const [args] = updateGiftMutate.mock.calls[0];
    // The whole point of the fix: an empty array reaches the backend so it can wipe.
    expect(Array.isArray(args.data.categories)).toBe(true);
    expect(args.data.categories).toEqual([]);
  });

  it('emits empty-string imageUrl when the user clicks X to remove the image (regression)', async () => {
    renderModal();

    // The remove button is the small X next to the preview — it sits in an
    // `absolute top-2 right-2` div. Match it by its X icon path's parent.
    const removeBtn = document.querySelector('.absolute.top-2.right-2 button');
    expect(removeBtn).not.toBeNull();
    fireEvent.click(removeBtn!);

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    const [args] = updateGiftMutate.mock.calls[0];
    // Empty string is the wire signal; the controller coerces it to null. Before
    // the fix this was the original URL, which is why removing was a no-op.
    expect(args.data.imageUrl).toBe('');
  });

  it('uploads the new file first, then submits the updated gift with the returned URL', async () => {
    renderModal();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    const file = new File(['bytes'], 'new.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // The mock resolves the upload immediately with a CDN URL.
    uploadFileMutate.mockImplementation((_file: File, opts: any) => opts?.onSuccess?.('https://cdn.example/new.jpg'));

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    expect(uploadFileMutate).toHaveBeenCalledTimes(1);
    const [args] = updateGiftMutate.mock.calls[0];
    expect(args.data.imageUrl).toBe('https://cdn.example/new.jpg');
  });

  it('calls onGiftSaved and onClose after a successful save', async () => {
    const { onClose, onGiftSaved } = renderModal();

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    expect(onGiftSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    // The saved-gift handoff to the parent must carry the new state — this is what
    // keeps the list in sync between the optimistic update and the refetch.
    expect(onGiftSaved.mock.calls[0][0].id).toBe(42);
  });

  it('does NOT close or notify the parent when the update is still pending', async () => {
    // Override so that updateGift never resolves in this test. We have to do this
    // BEFORE renderModal because the form submission validates asynchronously and
    // we need the mock in place by the time onFinish fires.
    updateGiftMutate.mockImplementation(() => undefined);
    const { onClose, onGiftSaved } = renderModal();

    submit();

    await waitFor(() => expect(updateGiftMutate).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(onGiftSaved).not.toHaveBeenCalled();
  });
});
