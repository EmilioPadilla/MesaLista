import { stripeMexico, paypalMexico, stripeMexicoBreakdown, paypalMexicoBreakdown } from 'utils/feeUtils';
import { cartItemsTotal as sharedCartItemsTotal } from 'utils/giftFunding';
import type { CartItem } from 'types/models/cart';

import type { PaymentMethod } from './payment';

export type FeePreference = 'guest' | 'couple';

/**
 * Subtotal of the cart.
 *
 * Delegates to the shared helper, which sums the stored LINE price rather than
 * `gift.price`. For a group gift those are different numbers — the gift's price
 * is the funding goal — so the old `gift.price * quantity` showed (and would have
 * charged) the whole goal for a small contribution.
 */
export function cartItemsTotal(items?: CartItem[]): number {
  return sharedCartItemsTotal(items);
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

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

/**
 * Guest checkout validation. Only the name and email are required — they're what
 * the couple needs to know who sent the gift; the phone is optional (App Store
 * guideline 5.1.1(v)) and only checked for shape when it's filled in.
 */
export function validateGuestDetails({ name, email, phone }: GuestDetails): Partial<Record<keyof GuestDetails, string>> {
  const errors: Partial<Record<keyof GuestDetails, string>> = {};

  if (!name.trim()) errors.name = 'El nombre es requerido';

  if (!email.trim()) errors.email = 'El correo es requerido';
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Correo inválido';

  if (phone.trim() && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) errors.phone = 'Debe tener 10 dígitos';

  return errors;
}

/** Count of distinct line items in a cart. */
export function cartItemCount(items?: CartItem[]): number {
  return items?.length ?? 0;
}
