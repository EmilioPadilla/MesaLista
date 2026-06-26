import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { API_URL } from '@/lib/apiConfig';

export type PaymentMethod = 'stripe' | 'paypal';

export interface CheckoutReturn {
  /** 'success'/'cancel' come from our bridge; 'dismiss' means the user closed the browser. */
  status: 'success' | 'cancel' | 'dismiss';
  params: Record<string, string>;
}

/**
 * Build the backend bridge URL. Stripe/PayPal only accept http(s) return URLs,
 * so we point them at `/payments/mobile-return`, which 302s back to our app's
 * `redirect` deep link (forwarding provider params like PayPal's token/PayerID).
 */
function mobileReturnUrl(redirect: string, extra: Record<string, string>): string {
  const qs = new URLSearchParams({ redirect, ...extra });
  return `${API_URL}/payments/mobile-return?${qs.toString()}`;
}

/** success/cancel URLs handed to the payment provider for a given cart. */
export function buildReturnUrls(method: PaymentMethod, cart: { id: number; sessionId: string }) {
  const redirect = Linking.createURL('payment-return');
  const successUrl = mobileReturnUrl(redirect, { status: 'success', cartSession: cart.sessionId, method });
  const cancelUrl = mobileReturnUrl(redirect, { status: 'cancel', cartId: String(cart.id), method });
  return { redirect, successUrl, cancelUrl };
}

/**
 * Open the hosted checkout in an in-app browser session and resolve once it
 * returns to our deep link (or the user dismisses it).
 */
export async function openCheckout(checkoutUrl: string, redirectUrl: string): Promise<CheckoutReturn> {
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);

  if (result.type === 'success' && result.url) {
    const { queryParams } = Linking.parse(result.url);
    const params: Record<string, string> = {};
    Object.entries(queryParams ?? {}).forEach(([key, value]) => {
      if (value != null) params[key] = Array.isArray(value) ? String(value[0]) : String(value);
    });
    const status = params.status === 'cancel' ? 'cancel' : 'success';
    return { status, params };
  }

  return { status: 'dismiss', params: {} };
}
