import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AddGiftForm } from './AddGiftForm';

vi.mock('src/hooks/useGift', () => ({
  useCreateGift: () => ({ mutate: vi.fn(), isSuccess: false, isError: false }),
}));
vi.mock('src/hooks/useFiles', () => ({
  useUploadFile: () => ({ mutate: vi.fn() }),
}));

const renderForm = (isDraft: boolean) =>
  render(
    <MemoryRouter initialEntries={['/sol-y-emilio/gestionar']}>
      <AddGiftForm giftListId={225} isDraft={isDraft} />
    </MemoryRouter>,
  );

describe('AddGiftForm copy link button', () => {
  it('is offered once the registry is published', () => {
    renderForm(false);
    expect(screen.getByRole('button', { name: /copiar enlace/i })).toBeInTheDocument();
  });

  it('is hidden on a draft, whose link does not work for guests yet', () => {
    renderForm(true);
    expect(screen.queryByRole('button', { name: /copiar enlace/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver como invitado/i })).toBeInTheDocument();
  });
});
