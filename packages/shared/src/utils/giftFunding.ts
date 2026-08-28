/**
 * Group-gift funding math — the single source of truth for web, mobile AND the
 * server. Every place that shows a progress meter, prices a share, validates a
 * contribution or decides whether a gift is settled goes through here, so the
 * three surfaces can never disagree about how much is left on a gift.
 *
 * Two shapes of group gift sit alongside the original single-buyer gift:
 *   GROUP_FIXED — split into `contributorTarget` equal shares.
 *   GROUP_OPEN  — any amount from anyone until the goal is reached.
 */
import type { Gift, GiftType } from 'types/models/gift';

/** The subset of a gift this module needs. Keeps it usable on partial payloads. */
export type FundableGift = Pick<Gift, 'price' | 'giftType' | 'amountFunded'> &
  Partial<Pick<Gift, 'contributorTarget' | 'minContribution' | 'isPurchased' | 'contributorCount'>>;

/**
 * Smallest chip-in we accept on an open-ended gift when the couple hasn't set
 * their own floor. Below roughly this the payment processor's fixed fee eats an
 * absurd share of the contribution, so it protects the couple as much as us.
 */
export const DEFAULT_MIN_CONTRIBUTION = 50;

/** Most equal shares a couple can split one gift into. */
export const MAX_CONTRIBUTOR_TARGET = 50;
/** Fewest that still means "split" — one share is just a normal gift. */
export const MIN_CONTRIBUTOR_TARGET = 2;

/**
 * Money comparisons run on floats that have been through division and rounding,
 * so "is it fully funded" needs a hair of slack: half a cent is far below the
 * smallest representable payment and far above accumulated float error.
 */
const EPSILON = 0.005;

/** Round to cents, the smallest unit any processor will actually move. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Round UP to cents. Used for share prices — see `shareAmount`. */
function ceilMoney(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

export function isGroupGift(gift: Pick<FundableGift, 'giftType'>): boolean {
  return gift.giftType === 'GROUP_FIXED' || gift.giftType === 'GROUP_OPEN';
}

/**
 * What one share of a GROUP_FIXED gift costs.
 *
 * Rounded UP, deliberately: $1,000 split three ways is $333.34, not $333.33.
 * Every guest is quoted the identical amount — which is the entire promise of an
 * equal split — and the rounding drift lands in the couple's favour (three cents
 * over the goal) rather than leaving the gift a cent short of ever completing.
 */
export function shareAmount(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return roundMoney(gift.price);
  const target = gift.contributorTarget ?? 0;
  if (target < 1) return roundMoney(gift.price);
  return ceilMoney(gift.price / target);
}

/**
 * The amount that actually settles this gift.
 *
 * For a fixed split that's `share × target`, which can sit a couple of cents
 * above `price` thanks to the rounding above. Using it (rather than `price`) as
 * the completion bar is what stops a fully-claimed gift from reading as 99.9%.
 */
export function fundingGoal(gift: FundableGift): number {
  if (gift.giftType === 'GROUP_FIXED') {
    const target = gift.contributorTarget ?? 0;
    if (target >= 1) return roundMoney(shareAmount(gift) * target);
  }
  return roundMoney(gift.price);
}

/** Money still needed to settle the gift. Never negative. */
export function remainingAmount(gift: FundableGift): number {
  return Math.max(0, roundMoney(fundingGoal(gift) - (gift.amountFunded ?? 0)));
}

/** Progress as 0–1, clamped. Safe on a zero-priced gift. */
export function fundingRatio(gift: FundableGift): number {
  const goal = fundingGoal(gift);
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, (gift.amountFunded ?? 0) / goal));
}

/** Progress as a whole percentage, for display. */
export function fundingPercent(gift: FundableGift): number {
  return Math.round(fundingRatio(gift) * 100);
}

/** Whether the goal has been met. Group gifts flip `isPurchased` on this. */
export function isFullyFunded(gift: FundableGift): boolean {
  return (gift.amountFunded ?? 0) + EPSILON >= fundingGoal(gift);
}

/** Shares already paid for on a GROUP_FIXED gift. */
export function sharesClaimed(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return 0;
  const share = shareAmount(gift);
  if (share <= 0) return 0;
  return Math.min(gift.contributorTarget ?? 0, Math.round(((gift.amountFunded ?? 0) + EPSILON) / share));
}

/** Shares still up for grabs on a GROUP_FIXED gift. */
export function sharesRemaining(gift: FundableGift): number {
  if (gift.giftType !== 'GROUP_FIXED') return 0;
  return Math.max(0, (gift.contributorTarget ?? 0) - sharesClaimed(gift));
}

/**
 * The floor for a single contribution to an open-ended gift.
 *
 * When less than the floor is left to raise, the floor becomes exactly what's
 * left — otherwise the final stretch of a nearly-complete gift would be
 * unfundable, which is the one moment guests most want to help.
 */
export function minContributionFor(gift: FundableGift): number {
  const floor = gift.minContribution && gift.minContribution > 0 ? gift.minContribution : DEFAULT_MIN_CONTRIBUTION;
  const remaining = remainingAmount(gift);
  if (remaining <= 0) return 0;
  return roundMoney(Math.min(floor, remaining));
}

export interface ContributionCheck {
  ok: boolean;
  /** The amount to actually charge — clamped to what's left. */
  amount: number;
  /** Spanish, guest-facing: this is rendered straight into the UI. */
  error?: string;
}

/**
 * Validate (and clamp) a guest's chosen amount for a GROUP_OPEN gift.
 *
 * Clamping down to the remaining amount rather than rejecting is deliberate: a
 * guest who types $2,000 at a gift needing $1,500 meant to finish it off, and
 * bouncing them back to the form to guess the exact number would be hostile.
 */
export function validateContribution(gift: FundableGift, rawAmount: number): ContributionCheck {
  if (!isGroupGift(gift)) {
    return { ok: false, amount: 0, error: 'Este regalo no acepta aportaciones' };
  }
  if (isFullyFunded(gift) || gift.isPurchased) {
    return { ok: false, amount: 0, error: 'Este regalo ya está completo' };
  }
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return { ok: false, amount: 0, error: 'Ingresa un monto válido' };
  }

  const remaining = remainingAmount(gift);
  const min = minContributionFor(gift);
  const amount = roundMoney(Math.min(rawAmount, remaining));

  if (amount + EPSILON < min) {
    return { ok: false, amount, error: `La aportación mínima es de $${min.toLocaleString('es-MX')}` };
  }

  return { ok: true, amount };
}

export interface SharesCheck {
  ok: boolean;
  shares: number;
  /** What the guest pays in total for those shares. */
  amount: number;
  error?: string;
}

/**
 * Validate a guest claiming N shares of a GROUP_FIXED gift.
 *
 * One guest may cover several shares — someone who wants to put in more than
 * their part shouldn't have to check out twice.
 */
export function validateShares(gift: FundableGift, rawShares: number): SharesCheck {
  if (gift.giftType !== 'GROUP_FIXED') {
    return { ok: false, shares: 0, amount: 0, error: 'Este regalo no se divide en partes' };
  }
  if (isFullyFunded(gift) || gift.isPurchased) {
    return { ok: false, shares: 0, amount: 0, error: 'Este regalo ya está completo' };
  }

  const available = sharesRemaining(gift);
  const shares = Math.floor(rawShares);

  if (!Number.isFinite(shares) || shares < 1) {
    return { ok: false, shares: 0, amount: 0, error: 'Elige al menos una parte' };
  }
  if (shares > available) {
    return {
      ok: false,
      shares: available,
      amount: roundMoney(shareAmount(gift) * available),
      error: available === 1 ? 'Solo queda 1 parte disponible' : `Solo quedan ${available} partes disponibles`,
    };
  }

  return { ok: true, shares, amount: roundMoney(shareAmount(gift) * shares) };
}

/**
 * Suggested amounts for the open-ended contribution picker.
 *
 * Quarter / half / all of what's left, plus the floor if it isn't already
 * covered — three taps that cover almost every intent, so most guests never open
 * the keyboard. Deduped and dropped once they exceed what's left.
 */
export function contributionPresets(gift: FundableGift): number[] {
  const remaining = remainingAmount(gift);
  if (remaining <= 0) return [];

  const min = minContributionFor(gift);
  const roundToNice = (value: number) => {
    if (value >= 1000) return Math.round(value / 100) * 100;
    if (value >= 100) return Math.round(value / 50) * 50;
    return Math.round(value / 10) * 10;
  };

  const candidates = [min, roundToNice(remaining / 4), roundToNice(remaining / 2), remaining];

  return [...new Set(candidates.map(roundMoney))]
    .filter((value) => value >= min && value <= remaining)
    .sort((a, b) => a - b);
}

/**
 * What a cart line actually costs.
 *
 * ALWAYS the stored line price, never `gift.price`. For a group gift those are
 * different numbers — `gift.price` is the funding goal, while the line holds the
 * share price or the amount this guest chose — so reading the gift would show a
 * guest chipping in $500 a total of $5,000 and then charge them something else.
 * `gift.price` remains the fallback only for a legacy line stored without one.
 */
export function cartLineTotal(item: { price?: number | null; quantity: number; gift?: { price?: number } | null }): number {
  const unit = item.price ?? item.gift?.price ?? 0;
  return roundMoney(unit * item.quantity);
}

/** Sum of every line in a cart. */
export function cartItemsTotal(items?: Array<Parameters<typeof cartLineTotal>[0]>): number {
  return roundMoney((items ?? []).reduce((sum, item) => sum + cartLineTotal(item), 0));
}

/**
 * Money actually raised across a set of gifts.
 *
 * A normal gift contributes its full price once bought — all or nothing. A group
 * gift contributes whatever it has raised so far, because a half-funded honeymoon
 * is real money the couple will receive. Counting only `isPurchased` gifts would
 * under-report the figure couples check most.
 */
export function raisedAmount(
  gifts?: Array<Pick<Gift, 'price' | 'isPurchased'> & Partial<Pick<Gift, 'giftType' | 'amountFunded'>>>,
): number {
  return roundMoney(
    (gifts ?? []).reduce((sum, gift) => {
      if (gift.giftType && gift.giftType !== 'SINGLE') return sum + (gift.amountFunded ?? 0);
      return gift.isPurchased ? sum + gift.price : sum;
    }, 0),
  );
}

/** Short Spanish label for a gift type. Shared by both apps' type pickers. */
export const GIFT_TYPE_LABELS: Record<GiftType, string> = {
  SINGLE: 'Regalo individual',
  GROUP_FIXED: 'Regalo en partes',
  GROUP_OPEN: 'Aportación libre',
};

/** One-line explanation of each type, shown under the label in both pickers. */
export const GIFT_TYPE_HINTS: Record<GiftType, string> = {
  SINGLE: 'Una persona lo regala completo.',
  GROUP_FIXED: 'Se divide en partes iguales entre varios invitados.',
  GROUP_OPEN: 'Cada quien aporta lo que quiera hasta juntar el total.',
};
