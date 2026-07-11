import type Stripe from 'stripe';

/**
 * Gross-up used when the guest pays processing fees: the charged amount is
 * inflated so the couple nets the cart subtotal after the processor takes its
 * percent + fixed fee + 16% IVA on that fee.
 *
 * Must stay in sync with packages/shared/src/utils/feeUtils.ts, which is what
 * the web and mobile checkouts use to display the fee to the guest.
 */
function grossUp({ net, percent, fixed, tax }: { net: number; percent: number; fixed: number; tax: number }) {
  const gross = (net + fixed * (1 + tax)) / (1 - percent * (1 + tax));
  return Math.round(gross * 100) / 100;
}

export const stripeMexicoGross = (net: number) => grossUp({ net, percent: 0.036, fixed: 3, tax: 0.16 });

export const paypalMexicoGross = (net: number) => grossUp({ net, percent: 0.0395, fixed: 4, tax: 0.16 });

export interface ReconciledFee {
  transactionFee: number | null;
  netAmount: number | null;
  feeSource: 'reported' | 'estimated';
}

const ESTIMATED: ReconciledFee = { transactionFee: null, netAmount: null, feeSource: 'estimated' };

/**
 * Extracts the real processor fee and net amount from a Stripe PaymentIntent
 * whose `latest_charge.balance_transaction` has been expanded.
 *
 * Returns `null` fees with `feeSource: 'estimated'` if the balance_transaction
 * cannot be read (e.g. expansion failed, payment was a SetupIntent, refund pending).
 * In that case the analytics layer falls back to the formula-based estimate.
 */
export function reconcileStripeFee(paymentIntent: Stripe.PaymentIntent | null | undefined): ReconciledFee {
  if (!paymentIntent) return ESTIMATED;

  const latestCharge = paymentIntent.latest_charge as Stripe.Charge | string | null | undefined;
  if (!latestCharge || typeof latestCharge === 'string') return ESTIMATED;

  const balanceTx = latestCharge.balance_transaction as Stripe.BalanceTransaction | string | null | undefined;
  if (!balanceTx || typeof balanceTx === 'string') return ESTIMATED;

  return {
    transactionFee: balanceTx.fee / 100,
    netAmount: balanceTx.net / 100,
    feeSource: 'reported',
  };
}

/**
 * Extracts the real PayPal fee and net amount from a v2 capture response's
 * `seller_receivable_breakdown`. Returns estimated values when the breakdown
 * is missing or malformed (older PayPal accounts may omit it).
 */
export function reconcilePayPalFee(captureDetails: any): ReconciledFee {
  const breakdown = captureDetails?.seller_receivable_breakdown;
  const feeStr = breakdown?.paypal_fee?.value;
  const netStr = breakdown?.net_amount?.value;
  if (!feeStr || !netStr) return ESTIMATED;

  const fee = parseFloat(feeStr);
  const net = parseFloat(netStr);
  if (Number.isNaN(fee) || Number.isNaN(net)) return ESTIMATED;

  return {
    transactionFee: fee,
    netAmount: net,
    feeSource: 'reported',
  };
}
