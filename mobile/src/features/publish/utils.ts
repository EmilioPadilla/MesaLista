/**
 * Pure publish-flow logic, shared by the screen and its tests.
 *
 * Pricing constants and the plan comparison live in the shared package
 * (config/plans) so web, mobile and the server can't drift on what a plan costs.
 * The readiness rules mirror src/features/publish/utils/readiness.ts on web —
 * keep the two in sync so the surfaces don't disagree about what's missing.
 */
import { COMMISSION_RATE, comparePlans, discountedFixedPrice, FIXED_PLAN_PRICE_MXN, PLAN_BREAK_EVEN_MXN } from 'config/plans';
import type { DiscountInfo } from '@/features/signup/utils';

export { COMMISSION_RATE, comparePlans, discountedFixedPrice, FIXED_PLAN_PRICE_MXN, PLAN_BREAK_EVEN_MXN };

/** Commission rate as shown to couples, e.g. "3.00%". */
export const COMMISSION_LABEL = `${(COMMISSION_RATE * 100).toFixed(2)}%`;

export type PlanChoice = 'fixed' | 'commission' | '';

export interface ReadinessInput {
  giftCount: number;
  eventDate?: string | Date | null;
  /** The list's `imageUrl` — the cover guests see at the top of the registry. */
  coverImageUrl?: string | null;
}

export interface ReadinessResult {
  ready: boolean;
  /** What is still missing, in the order the couple should fix it. Empty when ready. */
  missing: string[];
}

/** An event date in the past almost always means the placeholder was never changed. */
function hasUsableEventDate(eventDate?: string | Date | null): boolean {
  if (!eventDate) return false;
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

export function checkPublishReadiness({ giftCount, eventDate, coverImageUrl }: ReadinessInput): ReadinessResult {
  const missing: string[] = [];

  if (!giftCount || giftCount < 1) {
    missing.push('Agrega al menos un regalo');
  }

  if (!hasUsableEventDate(eventDate)) {
    missing.push('Elige la fecha de tu evento');
  }

  if (!coverImageUrl || !coverImageUrl.trim()) {
    missing.push('Agrega una imagen de portada');
  }

  return { ready: missing.length === 0, missing };
}

export interface DiscountedPrice {
  original: number;
  discounted: number;
  savings: number;
}

/** Fixed-plan price after an (already validated) discount code. */
export function calculateDiscountedPrice(discountInfo: DiscountInfo | null | undefined, selectedPlan: PlanChoice): DiscountedPrice {
  const basePrice = FIXED_PLAN_PRICE_MXN;
  if (!discountInfo || selectedPlan !== 'fixed') {
    return { original: basePrice, discounted: basePrice, savings: 0 };
  }

  const discounted = discountedFixedPrice(discountInfo);
  return { original: basePrice, discounted, savings: basePrice - discounted };
}

export function formatMxn(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-MX')} MXN`;
}

/**
 * Return URLs for the fixed-plan Stripe checkout. Stripe only substitutes a
 * LITERAL `{CHECKOUT_SESSION_ID}` placeholder, so the success URL is assembled
 * by hand instead of URLSearchParams (which would percent-encode the braces).
 * Both point at the backend bridge, which 302s to our `redirect` deep link.
 */
export function buildPlanReturnUrls(apiUrl: string, redirect: string): { successUrl: string; cancelUrl: string } {
  const base = `${apiUrl}/payments/mobile-return?redirect=${encodeURIComponent(redirect)}`;
  return {
    successUrl: `${base}&status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}&status=cancel`,
  };
}
