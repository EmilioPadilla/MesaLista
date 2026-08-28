import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GiftType } from 'types/models/gift';

import { GiftTypeSelector } from './GiftTypeSelector';

// The couple's half. What must hold:
//   * the choice stays folded away until the couple asks for it, since nearly
//     every gift is a plain one — but it says which way is chosen;
//   * all three ways to pay for a gift are offered once unfolded, with the
//     original single gift available and never removed;
//   * the per-share amount previews live, because that's the number a guest sees;
//   * a gift guests have already paid into is locked.

const onChange = vi.fn();
const onContributorTargetChange = vi.fn();
const onMinContributionChange = vi.fn();

function setup(props: Partial<React.ComponentProps<typeof GiftTypeSelector>> = {}) {
  const value: GiftType = props.value ?? 'SINGLE';
  return render(
    <GiftTypeSelector
      value={value}
      onChange={onChange}
      price={3000}
      contributorTarget={null}
      onContributorTargetChange={onContributorTargetChange}
      minContribution={null}
      onMinContributionChange={onMinContributionChange}
      {...props}
    />,
  );
}

/** The summary row carries the same label as its tile, so pick the tile by its role. */
function tile(label: string) {
  const found = screen
    .getAllByRole('button')
    .find((button) => button.hasAttribute('aria-pressed') && button.textContent?.includes(label));
  if (!found) throw new Error(`No tile for "${label}"`);
  return found;
}

function unfold() {
  fireEvent.click(screen.getByRole('button', { expanded: false }));
}

beforeEach(() => vi.clearAllMocks());

describe('GiftTypeSelector', () => {
  it('stays folded on a plain gift, showing what is chosen', () => {
    setup();
    const toggle = screen.getByRole('button', { expanded: false });
    expect(toggle).toHaveTextContent('Regalo individual');
    expect(toggle).toHaveTextContent('Una persona lo regala completo.');
  });

  it('offers all three ways to fund a gift once unfolded', () => {
    setup();
    unfold();

    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    expect(tile('Regalo individual')).toBeInTheDocument();
    expect(tile('Regalo en partes')).toBeInTheDocument();
    expect(tile('Aportación libre')).toBeInTheDocument();
  });

  // Editing a group gift: its terms live inside the panel, so it opens on its own.
  it('starts unfolded when the gift is already a group gift', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: 3 });
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
  });

  it('marks the selected type for assistive tech', () => {
    setup({ value: 'GROUP_OPEN' });
    const selected = screen.getByRole('button', { pressed: true });
    expect(selected).toHaveTextContent('Aportación libre');
  });

  it('reports a type change', () => {
    setup();
    unfold();
    fireEvent.click(tile('Regalo en partes'));
    expect(onChange).toHaveBeenCalledWith('GROUP_FIXED');
  });

  it('shows the split input only for a fixed split', () => {
    setup({ value: 'SINGLE' });
    expect(screen.queryByText(/Entre cuántas personas/i)).not.toBeInTheDocument();

    setup({ value: 'GROUP_FIXED' });
    expect(screen.getByText(/Entre cuántas personas/i)).toBeInTheDocument();
  });

  it('shows the minimum input only for an open goal', () => {
    setup({ value: 'GROUP_FIXED' });
    expect(screen.queryByText(/Aportación mínima/i)).not.toBeInTheDocument();

    setup({ value: 'GROUP_OPEN' });
    expect(screen.getByText(/Aportación mínima/i)).toBeInTheDocument();
  });

  // The number a guest will actually be quoted, shown as the couple sets the split.
  it('previews the per-person amount live', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: 3, price: 3000 });
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('rounds the preview up on an uneven split', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: 3, price: 1000 });
    expect(screen.getByText('$333.34')).toBeInTheDocument();
  });

  it('asks for the missing inputs instead of previewing nonsense', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: null, price: 0 });
    expect(screen.getByText(/Escribe un precio y un número de partes/i)).toBeInTheDocument();
  });

  // Folded again, the row has to carry the terms — otherwise the couple loses
  // sight of what a guest will be asked for.
  it('sums up the terms in the folded row', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: 3, price: 3000 });
    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.getByRole('button', { expanded: false })).toHaveTextContent('3 partes de $1,000 cada una.');
  });

  it('locks the other types once the gift has been funded', () => {
    setup({ value: 'GROUP_FIXED', contributorTarget: 3, locked: true });

    fireEvent.click(tile('Regalo individual'));
    expect(onChange).not.toHaveBeenCalled();

    expect(screen.getByText('Fijo')).toBeInTheDocument();
  });
});
