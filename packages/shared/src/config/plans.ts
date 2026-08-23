/**
 * Plan pricing, shared by every surface that has to reason about it: the web and
 * mobile publish screens, the pricing page, and the server's own copy of the
 * fixed-plan amount.
 *
 * These used to be duplicated across paymentController, the mobile signup utils
 * and web JSX, which is how the publish-time savings calculator could have
 * silently disagreed with what Stripe actually charges.
 */

/** One-time price of the fixed plan, in MXN. */
export const FIXED_PLAN_PRICE_MXN = 2000;

/** Share of each gift taken under the commission plan. */
export const COMMISSION_RATE = 0.03;

/**
 * Registry total at which the two plans cost the same: $66,667 MXN.
 * Below it commission is cheaper, above it the fixed plan is.
 */
export const PLAN_BREAK_EVEN_MXN = Math.round(FIXED_PLAN_PRICE_MXN / COMMISSION_RATE);

export interface PlanComparison {
  /** What the commission plan would cost on this registry total. */
  commissionCost: number;
  /** What the fixed plan costs (after any discount). */
  fixedCost: number;
  /** Positive when the fixed plan is cheaper, by this much. */
  fixedSavings: number;
  /** Which plan costs less at this total. Equal totals resolve to commission. */
  cheaper: 'fixed' | 'commission';
}

/**
 * Compare both plans for a couple's expected registry total.
 *
 * `goal` is what they expect to receive in gifts. Non-finite or negative goals
 * are treated as zero rather than throwing — this runs on every keystroke of a
 * free-text input.
 */
export function comparePlans(goal: number, fixedPrice: number = FIXED_PLAN_PRICE_MXN): PlanComparison {
  const total = Number.isFinite(goal) && goal > 0 ? goal : 0;
  const commissionCost = total * COMMISSION_RATE;
  const fixedSavings = commissionCost - fixedPrice;

  return {
    commissionCost,
    fixedCost: fixedPrice,
    fixedSavings,
    cheaper: fixedSavings > 0 ? 'fixed' : 'commission',
  };
}

/** Apply a discount code to the fixed-plan price. Mirrors the server's calculation. */
export function discountedFixedPrice(discount?: { discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'; discountValue: number } | null): number {
  if (!discount) return FIXED_PLAN_PRICE_MXN;
  const price =
    discount.discountType === 'PERCENTAGE'
      ? FIXED_PLAN_PRICE_MXN - (FIXED_PLAN_PRICE_MXN * discount.discountValue) / 100
      : FIXED_PLAN_PRICE_MXN - discount.discountValue;
  return Math.max(0, Math.round(price));
}
