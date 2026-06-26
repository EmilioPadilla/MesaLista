import { stripeMexico, paypalMexico, stripeMexicoBreakdown, paypalMexicoBreakdown } from 'utils/feeUtils';
import type { CartItem } from 'types/models/cart';

import type { PaymentMethod } from './payment';

export type FeePreference = 'guest' | 'couple';

/** Subtotal of the cart (sum of gift price × quantity). */
export function cartItemsTotal(items?: CartItem[]): number {
  return (items ?? []).reduce((sum, item) => sum + (item.gift?.price ?? 0) * item.quantity, 0);
}

export interface CheckoutTotals {
  stripeFee: number;
  paypalFee: number;
  /** Fee shown for the currently selected method. */
  currentFee: number;
  /** Amount the guest is charged. */
  finalTotal: number;
}

/**
 * Mirror the web Checkout fee logic. When the couple absorbs fees the guest pays
 * the subtotal and we only surface the deducted fee; when the guest pays fees,
 * the charge is grossed up so the couple nets the subtotal.
 */
export function computeCheckoutTotals(
  cartTotal: number,
  feePreference: FeePreference,
  method: PaymentMethod | null,
): CheckoutTotals {
  if (feePreference === 'guest') {
    const stripeGross = stripeMexico(cartTotal);
    const paypalGross = paypalMexico(cartTotal);
    const stripeFee = stripeGross - cartTotal;
    const paypalFee = paypalGross - cartTotal;
    const finalTotal = method === 'paypal' ? paypalGross : method === 'stripe' ? stripeGross : cartTotal;
    return { stripeFee, paypalFee, currentFee: method === 'paypal' ? paypalFee : stripeFee, finalTotal };
  }

  const stripeFee = stripeMexicoBreakdown(cartTotal).totalFee;
  const paypalFee = paypalMexicoBreakdown(cartTotal).totalFee;
  return { stripeFee, paypalFee, currentFee: method === 'paypal' ? paypalFee : stripeFee, finalTotal: cartTotal };
}

/** Count of distinct line items in a cart. */
export function cartItemCount(items?: CartItem[]): number {
  return items?.length ?? 0;
}
