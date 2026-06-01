import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GiftListSelector } from './GiftListSelector';

describe('GiftListSelector', () => {
  it('renders nothing when giftLists is undefined', () => {
    const { container } = render(
      <GiftListSelector giftLists={undefined} activeGiftListId={null} activeTitle="" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is only one gift list', () => {
    const { container } = render(
      <GiftListSelector
        giftLists={[{ id: 1, title: 'Boda de Sol & Emilio' }]}
        activeGiftListId={1}
        activeTitle="Boda de Sol & Emilio"
        onChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the active title in the header chip when there are multiple lists', () => {
    render(
      <GiftListSelector
        giftLists={[
          { id: 1, title: 'Boda' },
          { id: 2, title: 'Despedida' },
        ]}
        activeGiftListId={1}
        activeTitle="Boda"
        onChange={vi.fn()}
      />,
    );
    // The active title shows in our left-side chip AND inside antd's Select. Just assert the chip + label exist.
    expect(screen.getAllByText('Boda').length).toBeGreaterThan(0);
    expect(screen.getByText(/mesa activa/i)).toBeInTheDocument();
  });

  it('falls back to coupleName when title is missing', () => {
    render(
      <GiftListSelector
        giftLists={[
          { id: 1, coupleName: 'Sol y Emilio' },
          { id: 2, coupleName: 'Ana y Luis' },
        ]}
        activeGiftListId={1}
        activeTitle="Sol y Emilio"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Sol y Emilio').length).toBeGreaterThan(0);
  });
});
