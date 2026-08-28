import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Gift } from 'types/models/gift';

import { ContributionPicker } from './ContributionPicker';

// The guest-facing half of group gifts. What must hold on screen:
//   * the picker sends INTENT (shares / amount), never a price — the server prices it;
//   * an over-large amount is clamped to what's left rather than rejected;
//   * the guest can never submit more shares than remain.

const onSubmit = vi.fn();

const fixedGift = (over: Partial<Gift> = {}): Gift =>
  ({
    id: 1,
    title: 'Luna de miel',
    description: '',
    price: 3000,
    giftType: 'GROUP_FIXED',
    contributorTarget: 3,
    minContribution: null,
    amountFunded: 0,
    contributorCount: 0,
    isPurchased: false,
    isMostWanted: false,
    giftListId: 1,
    quantity: 1,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Gift;

const openGift = (over: Partial<Gift> = {}): Gift =>
  fixedGift({ giftType: 'GROUP_OPEN', price: 5000, contributorTarget: null, ...over });

beforeEach(() => vi.clearAllMocks());

describe('ContributionPicker — fixed split', () => {
  it('shows the per-person share as the headline number', () => {
    render(<ContributionPicker gift={fixedGift()} onSubmit={onSubmit} />);
    // $3,000 split three ways. It appears twice by design — as the hero number
    // and again in the submit row — so assert on the hero specifically.
    expect(screen.getByText('Tu parte').nextElementSibling).toHaveTextContent('$1,000');
  });

  it('submits one share by default', () => {
    render(<ContributionPicker gift={fixedGift()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar mi aportación/i }));
    expect(onSubmit).toHaveBeenCalledWith({ shares: 1 });
  });

  it('lets a guest cover several shares', () => {
    render(<ContributionPicker gift={fixedGift()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /Agregar mi aportación/i }));
    expect(onSubmit).toHaveBeenCalledWith({ shares: 2 });
  });

  it('offers only the shares that remain', () => {
    // Two of three already claimed — only "1" should be selectable.
    render(<ContributionPicker gift={fixedGift({ amountFunded: 2000 })} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });

  it('reports how many parts are left', () => {
    render(<ContributionPicker gift={fixedGift({ amountFunded: 1000 })} onSubmit={onSubmit} />);
    expect(screen.getByText(/Quedan 2 partes/i)).toBeInTheDocument();
  });
});

describe('ContributionPicker — open goal', () => {
  it('sends the chosen amount, not a price', () => {
    render(<ContributionPicker gift={openGift()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Monto a aportar');
    fireEvent.change(input, { target: { value: '750' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar mi aportación/i }));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 750 });
  });

  it('clamps an amount larger than what is left', () => {
    render(<ContributionPicker gift={openGift({ amountFunded: 4000 })} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Monto a aportar');
    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar mi aportación/i }));
    // Only $1,000 remains, so that's what gets submitted.
    expect(onSubmit).toHaveBeenCalledWith({ amount: 1000 });
  });

  it('blocks submitting below the minimum and says why', () => {
    render(<ContributionPicker gift={openGift({ minContribution: 500 })} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Monto a aportar');
    fireEvent.change(input, { target: { value: '10' } });

    expect(screen.getByText(/La aportación mínima es de/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Agregar mi aportación/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects non-numeric input rather than submitting junk', () => {
    render(<ContributionPicker gift={openGift()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Monto a aportar') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe('');
  });

  it('flags the preset that finishes the gift off', () => {
    render(<ContributionPicker gift={openGift({ amountFunded: 4500 })} onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: /Completar/i })).toBeInTheDocument();
  });

  it('shows how much is still needed', () => {
    render(<ContributionPicker gift={openGift({ amountFunded: 1250 })} onSubmit={onSubmit} />);
    // Stated twice on purpose: once as the gift's status line, once under the
    // amount field where the guest is choosing.
    expect(screen.getAllByText(/Faltan \$3,750/i).length).toBeGreaterThan(0);
  });
});
