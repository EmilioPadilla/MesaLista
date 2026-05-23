import { describe, it, expect } from 'vitest';
import { reconcileStripeFee, reconcilePayPalFee } from './paymentFees.js';

describe('reconcileStripeFee', () => {
  it('extracts fee and net from a fully expanded balance_transaction (amounts in cents)', () => {
    // Real shape: Stripe returns amounts as integer cents.
    const intent = {
      latest_charge: {
        balance_transaction: { fee: 9026, net: 198774 },
      },
    } as any;

    const result = reconcileStripeFee(intent);

    expect(result).toEqual({ transactionFee: 90.26, netAmount: 1987.74, feeSource: 'reported' });
  });

  it('falls back to estimated when paymentIntent is null', () => {
    expect(reconcileStripeFee(null)).toEqual({ transactionFee: null, netAmount: null, feeSource: 'estimated' });
  });

  it('falls back to estimated when latest_charge is just an id (not expanded)', () => {
    const intent = { latest_charge: 'ch_123' } as any;
    expect(reconcileStripeFee(intent).feeSource).toBe('estimated');
  });

  it('falls back to estimated when latest_charge is missing', () => {
    const intent = {} as any;
    expect(reconcileStripeFee(intent).feeSource).toBe('estimated');
  });

  it('falls back to estimated when balance_transaction is just an id (not expanded)', () => {
    const intent = {
      latest_charge: { balance_transaction: 'txn_123' },
    } as any;
    expect(reconcileStripeFee(intent).feeSource).toBe('estimated');
  });

  it('falls back to estimated when balance_transaction is null', () => {
    const intent = { latest_charge: { balance_transaction: null } } as any;
    expect(reconcileStripeFee(intent).feeSource).toBe('estimated');
  });
});

describe('reconcilePayPalFee', () => {
  it('extracts fee and net from seller_receivable_breakdown (amounts as strings in major units)', () => {
    const capture = {
      seller_receivable_breakdown: {
        gross_amount: { value: '2200.00', currency_code: 'MXN' },
        paypal_fee: { value: '91.78', currency_code: 'MXN' },
        net_amount: { value: '2108.22', currency_code: 'MXN' },
      },
    };

    const result = reconcilePayPalFee(capture);

    expect(result).toEqual({ transactionFee: 91.78, netAmount: 2108.22, feeSource: 'reported' });
  });

  it('falls back to estimated when seller_receivable_breakdown is missing (legacy PayPal accounts)', () => {
    const capture = { amount: { value: '2200.00' } };
    expect(reconcilePayPalFee(capture)).toEqual({ transactionFee: null, netAmount: null, feeSource: 'estimated' });
  });

  it('falls back to estimated when paypal_fee is missing', () => {
    const capture = {
      seller_receivable_breakdown: {
        net_amount: { value: '2108.22' },
      },
    };
    expect(reconcilePayPalFee(capture).feeSource).toBe('estimated');
  });

  it('falls back to estimated when net_amount is missing', () => {
    const capture = {
      seller_receivable_breakdown: {
        paypal_fee: { value: '91.78' },
      },
    };
    expect(reconcilePayPalFee(capture).feeSource).toBe('estimated');
  });

  it('falls back to estimated when values are non-numeric strings', () => {
    const capture = {
      seller_receivable_breakdown: {
        paypal_fee: { value: 'invalid' },
        net_amount: { value: 'invalid' },
      },
    };
    expect(reconcilePayPalFee(capture).feeSource).toBe('estimated');
  });

  it('handles null captureDetails gracefully', () => {
    expect(reconcilePayPalFee(null)).toEqual({ transactionFee: null, netAmount: null, feeSource: 'estimated' });
    expect(reconcilePayPalFee(undefined)).toEqual({ transactionFee: null, netAmount: null, feeSource: 'estimated' });
  });
});
