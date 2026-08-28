/**
 * Group-gift funding math and input validation, server side.
 *
 * Must stay in sync with packages/shared/src/utils/giftFunding.ts, which is what
 * the web and mobile apps use to render progress meters and price shares. Same
 * arrangement as paymentFees.ts: the server keeps its own copy rather than
 * importing across the workspace boundary, because these numbers decide what a
 * guest is charged and must not depend on client-side code being honest.
 *
 * The rule everywhere: the client says WHAT it wants (this many shares, this
 * amount); the server decides what that COSTS.
 */
export type GiftType = 'SINGLE' | 'GROUP_FIXED' | 'GROUP_OPEN';

export const GIFT_TYPES: GiftType[] = ['SINGLE', 'GROUP_FIXED', 'GROUP_OPEN'];

export const DEFAULT_MIN_CONTRIBUTION = 50;
export const MAX_CONTRIBUTOR_TARGET = 50;
export const MIN_CONTRIBUTOR_TARGET = 2;

/** Half a cent of slack for float comparisons. See the shared module. */
const EPSILON = 0.005;

export interface FundableGift {
  price: number;
  giftType: GiftType;
  amountFunded: number;
  contributorTarget?: number | null;
  minContribution?: number | null;
  isPurchased?: boolean;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function ceilMoney(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

export function isGroupGift(giftType: GiftType): boolean {
  return giftType === 'GROUP_FIXED' || giftType === 'GROUP_OPEN';
}

/** Price of one share, rounded UP so every guest pays the same and the gift completes. */
export function shareAmount(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return roundMoney(gift.price);
  const target = gift.contributorTarget ?? 0;
  if (target < 1) return roundMoney(gift.price);
  return ceilMoney(gift.price / target);
}

/** The amount that actually settles the gift (share × target for fixed splits). */
export function fundingGoal(gift: FundableGift): number {
  if (gift.giftType === 'GROUP_FIXED') {
    const target = gift.contributorTarget ?? 0;
    if (target >= 1) return roundMoney(shareAmount(gift) * target);
  }
  return roundMoney(gift.price);
}

export function remainingAmount(gift: FundableGift): number {
  return Math.max(0, roundMoney(fundingGoal(gift) - (gift.amountFunded ?? 0)));
}

export function isFullyFunded(gift: FundableGift): boolean {
  return (gift.amountFunded ?? 0) + EPSILON >= fundingGoal(gift);
}

export function sharesClaimed(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return 0;
  const share = shareAmount(gift);
  if (share <= 0) return 0;
  return Math.min(gift.contributorTarget ?? 0, Math.round(((gift.amountFunded ?? 0) + EPSILON) / share));
}

export function sharesRemaining(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return 0;
  return Math.max(0, (gift.contributorTarget ?? 0) - sharesClaimed(gift));
}

/** Contribution floor, lowered to the remainder so a nearly-full gift stays fundable. */
export function minContributionFor(gift: FundableGift): number {
  const floor = gift.minContribution && gift.minContribution > 0 ? gift.minContribution : DEFAULT_MIN_CONTRIBUTION;
  const remaining = remainingAmount(gift);
  if (remaining <= 0) return 0;
  return roundMoney(Math.min(floor, remaining));
}

export interface PricedLine {
  ok: boolean;
  /** Per-unit price to store on the cart line. */
  price: number;
  /** Units to store on the cart line: shares for GROUP_FIXED, 1 for GROUP_OPEN. */
  quantity: number;
  error?: string;
}

/**
 * Turn a guest's request into the cart line to store, or an error.
 *
 * This is the server's pricing authority for group gifts. `price * quantity` is
 * what the guest is charged, which is exactly how SINGLE gifts already work —
 * that symmetry is what let checkout, the Stripe/PayPal line items and the
 * confirmation emails stay untouched: they all price off the LINE.
 *
 * The corollary is a rule, not a nicety: anything reporting on money must read
 * `item.price`, never `gift.price`. paymentAnalyticsService did the latter and
 * reported a $500 contribution toward a $3,000 goal as $3,000. Use lineTotal().
 */
export function priceContribution(gift: FundableGift, input: { shares?: number; amount?: number }): PricedLine {
  if (!isGroupGift(gift.giftType)) {
    return { ok: false, price: 0, quantity: 0, error: 'Este regalo no acepta aportaciones' };
  }
  if (gift.isPurchased || isFullyFunded(gift)) {
    return { ok: false, price: 0, quantity: 0, error: 'Este regalo ya está completo' };
  }

  if (gift.giftType === 'GROUP_FIXED') {
    const available = sharesRemaining(gift);
    const shares = Math.floor(Number(input.shares ?? 1));

    if (!Number.isFinite(shares) || shares < 1) {
      return { ok: false, price: 0, quantity: 0, error: 'Elige al menos una parte' };
    }
    if (shares > available) {
      return {
        ok: false,
        price: 0,
        quantity: 0,
        error: available === 1 ? 'Solo queda 1 parte disponible' : `Solo quedan ${available} partes disponibles`,
      };
    }
    return { ok: true, price: shareAmount(gift), quantity: shares };
  }

  // GROUP_OPEN — clamp down to what's left rather than rejecting an over-large
  // amount: a guest aiming past the goal meant to finish the gift off.
  const requested = Number(input.amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    return { ok: false, price: 0, quantity: 0, error: 'Ingresa un monto válido' };
  }

  const amount = roundMoney(Math.min(requested, remainingAmount(gift)));
  const min = minContributionFor(gift);

  if (amount + EPSILON < min) {
    return { ok: false, price: 0, quantity: 0, error: `La aportación mínima es de $${min.toLocaleString('es-MX')}` };
  }

  return { ok: true, price: amount, quantity: 1 };
}

export interface GiftTypeInput {
  giftType?: unknown;
  contributorTarget?: unknown;
  minContribution?: unknown;
}

export interface NormalizedGiftType {
  giftType: GiftType;
  contributorTarget: number | null;
  minContribution: number | null;
}

export type GiftTypeValidation = { ok: true; value: NormalizedGiftType } | { ok: false; error: string };

/**
 * Validate and normalise the gift-type fields from a create/update payload.
 *
 * Always returns a fully-specified triple, so the caller can write all three
 * columns unconditionally. That matters on edit: switching a gift from a fixed
 * split back to a single gift has to CLEAR `contributorTarget`, not leave a
 * stale value behind that would resurface if the type were switched again.
 */
export function normalizeGiftType(input: GiftTypeInput, price: number): GiftTypeValidation {
  const raw = input.giftType;

  // Absent means "not a group gift" — which keeps every existing client, and the
  // mobile builds already in the App Store, working unchanged.
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: { giftType: 'SINGLE', contributorTarget: null, minContribution: null } };
  }

  if (typeof raw !== 'string' || !GIFT_TYPES.includes(raw as GiftType)) {
    return { ok: false, error: 'Tipo de regalo inválido' };
  }

  const giftType = raw as GiftType;

  if (giftType === 'SINGLE') {
    return { ok: true, value: { giftType, contributorTarget: null, minContribution: null } };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Un regalo grupal necesita una meta mayor a 0' };
  }

  if (giftType === 'GROUP_FIXED') {
    const target = Number(input.contributorTarget);
    if (!Number.isInteger(target) || target < MIN_CONTRIBUTOR_TARGET || target > MAX_CONTRIBUTOR_TARGET) {
      return {
        ok: false,
        error: `El número de partes debe estar entre ${MIN_CONTRIBUTOR_TARGET} y ${MAX_CONTRIBUTOR_TARGET}`,
      };
    }
    return { ok: true, value: { giftType, contributorTarget: target, minContribution: null } };
  }

  // GROUP_OPEN — the minimum is optional; null means the platform floor.
  const rawMin = input.minContribution;
  if (rawMin === undefined || rawMin === null || rawMin === '') {
    return { ok: true, value: { giftType, contributorTarget: null, minContribution: null } };
  }

  const min = Number(rawMin);
  if (!Number.isFinite(min) || min <= 0) {
    return { ok: false, error: 'La aportación mínima debe ser mayor a 0' };
  }
  if (min > price) {
    return { ok: false, error: 'La aportación mínima no puede ser mayor que la meta' };
  }

  return { ok: true, value: { giftType, contributorTarget: null, minContribution: roundMoney(min) } };
}

/**
 * The unit price a cart line actually charged — the price stored on the line,
 * never the gift's current price.
 *
 * `gift.price` is the funding GOAL for a group gift, so reading money off it
 * reports a $500 contribution toward a $3,000 honeymoon as $3,000. It is the
 * wrong number for single gifts too: the stored price is what the guest was
 * charged, and unlike the gift's it doesn't move when the couple edits the gift
 * afterwards. Checkout, the Stripe/PayPal line items and the confirmation emails
 * all already price off the line; anything reporting on money must do the same.
 *
 * Mirrors cartLineTotal() in packages/shared/src/utils/giftFunding.ts.
 */
export function lineUnitPrice(item: { price?: number | null; gift?: { price?: number | null } | null }): number {
  return item.price ?? item.gift?.price ?? 0;
}

/** What a cart line actually charged in total. */
export function lineTotal(item: { price?: number | null; quantity: number; gift?: { price?: number | null } | null }): number {
  return roundMoney(lineUnitPrice(item) * item.quantity);
}
