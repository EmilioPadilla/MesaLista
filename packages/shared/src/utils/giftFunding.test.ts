import { describe, it, expect } from 'vitest';

import {
  DEFAULT_MIN_CONTRIBUTION,
  cartItemsTotal,
  cartLineTotal,
  contributionPresets,
  raisedAmount,
  fundingGoal,
  fundingPercent,
  isFullyFunded,
  isGroupGift,
  minContributionFor,
  remainingAmount,
  shareAmount,
  sharesClaimed,
  sharesRemaining,
  validateContribution,
  validateShares,
  type FundableGift,
} from './giftFunding';

const single = (over: Partial<FundableGift> = {}): FundableGift => ({
  price: 1500,
  giftType: 'SINGLE',
  amountFunded: 0,
  ...over,
});

const fixed = (over: Partial<FundableGift> = {}): FundableGift => ({
  price: 3000,
  giftType: 'GROUP_FIXED',
  contributorTarget: 3,
  amountFunded: 0,
  ...over,
});

const open = (over: Partial<FundableGift> = {}): FundableGift => ({
  price: 5000,
  giftType: 'GROUP_OPEN',
  amountFunded: 0,
  ...over,
});

describe('gift type predicates', () => {
  it('treats only the two group variants as group gifts', () => {
    expect(isGroupGift(single())).toBe(false);
    expect(isGroupGift(fixed())).toBe(true);
    expect(isGroupGift(open())).toBe(true);
  });
});

describe('shareAmount', () => {
  it('divides evenly when the price allows it', () => {
    expect(shareAmount(fixed({ price: 3000, contributorTarget: 3 }))).toBe(1000);
  });

  // The rounding direction is the whole reason this helper exists: every guest
  // must be quoted the same number, and the gift must remain completable.
  it('rounds a share UP so N equal shares always cover the price', () => {
    const gift = fixed({ price: 1000, contributorTarget: 3 });
    expect(shareAmount(gift)).toBe(333.34);
    expect(shareAmount(gift) * 3).toBeGreaterThanOrEqual(1000);
  });

  it('falls back to the full price when the target is missing or nonsensical', () => {
    expect(shareAmount(fixed({ contributorTarget: null }))).toBe(3000);
    expect(shareAmount(fixed({ contributorTarget: 0 }))).toBe(3000);
  });
});

describe('fundingGoal', () => {
  it('uses price for open-ended gifts', () => {
    expect(fundingGoal(open({ price: 5000 }))).toBe(5000);
  });

  // Without this a fully-claimed uneven split would show as 99.99% forever.
  it('uses share × target for fixed splits so a full claim really completes', () => {
    const gift = fixed({ price: 1000, contributorTarget: 3 });
    expect(fundingGoal(gift)).toBe(1000.02);
    expect(isFullyFunded({ ...gift, amountFunded: 1000.02 })).toBe(true);
  });
});

describe('progress reporting', () => {
  it('reports remaining and percent for a partially funded gift', () => {
    const gift = open({ price: 5000, amountFunded: 1250 });
    expect(remainingAmount(gift)).toBe(3750);
    expect(fundingPercent(gift)).toBe(25);
  });

  it('never reports negative remaining or over 100% when overfunded', () => {
    const gift = open({ price: 5000, amountFunded: 6000 });
    expect(remainingAmount(gift)).toBe(0);
    expect(fundingPercent(gift)).toBe(100);
  });

  it('does not divide by zero on a zero-priced gift', () => {
    expect(fundingPercent(open({ price: 0 }))).toBe(0);
    expect(remainingAmount(open({ price: 0 }))).toBe(0);
  });
});

describe('share accounting', () => {
  it('derives claimed and remaining shares from money raised', () => {
    const gift = fixed({ price: 3000, contributorTarget: 3, amountFunded: 2000 });
    expect(sharesClaimed(gift)).toBe(2);
    expect(sharesRemaining(gift)).toBe(1);
  });

  // Uneven splits accumulate rounding; claimed-share counting must survive it.
  it('counts shares correctly for an unevenly divisible price', () => {
    const gift = fixed({ price: 1000, contributorTarget: 3 });
    const share = shareAmount(gift);
    expect(sharesClaimed({ ...gift, amountFunded: share })).toBe(1);
    expect(sharesClaimed({ ...gift, amountFunded: share * 2 })).toBe(2);
    expect(sharesRemaining({ ...gift, amountFunded: share * 2 })).toBe(1);
  });

  it('reports zero shares for non-fixed gifts', () => {
    expect(sharesRemaining(open())).toBe(0);
    expect(sharesClaimed(single())).toBe(0);
  });
});

describe('validateShares', () => {
  it('accepts a single share and prices it', () => {
    const result = validateShares(fixed({ price: 3000, contributorTarget: 3 }), 1);
    expect(result).toMatchObject({ ok: true, shares: 1, amount: 1000 });
  });

  it('lets one guest cover several shares at once', () => {
    const result = validateShares(fixed({ price: 3000, contributorTarget: 3 }), 2);
    expect(result).toMatchObject({ ok: true, shares: 2, amount: 2000 });
  });

  it('refuses more shares than remain and reports how many are left', () => {
    const gift = fixed({ price: 3000, contributorTarget: 3, amountFunded: 2000 });
    const result = validateShares(gift, 2);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('1 parte');
  });

  it('refuses a gift that is already complete', () => {
    const gift = fixed({ price: 3000, contributorTarget: 3, amountFunded: 3000 });
    expect(validateShares(gift, 1).ok).toBe(false);
  });

  it('refuses zero, negative and fractional share counts', () => {
    const gift = fixed();
    expect(validateShares(gift, 0).ok).toBe(false);
    expect(validateShares(gift, -1).ok).toBe(false);
    expect(validateShares(gift, 0.5).ok).toBe(false);
  });
});

describe('validateContribution', () => {
  it('accepts an amount at or above the floor', () => {
    expect(validateContribution(open(), 500)).toMatchObject({ ok: true, amount: 500 });
  });

  it('rejects an amount below the floor', () => {
    const result = validateContribution(open(), 10);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('mínima');
  });

  it('honours a couple-set minimum over the platform default', () => {
    const gift = open({ minContribution: 200 });
    expect(minContributionFor(gift)).toBe(200);
    expect(validateContribution(gift, 100).ok).toBe(false);
    expect(validateContribution(gift, 200).ok).toBe(true);
  });

  // Erring toward "let them finish it" rather than bouncing them to the form.
  it('clamps an over-large amount down to what is left', () => {
    const gift = open({ price: 5000, amountFunded: 3500 });
    expect(validateContribution(gift, 2000)).toMatchObject({ ok: true, amount: 1500 });
  });

  // The last stretch of a nearly-funded gift must stay fundable.
  it('lowers the floor to the remainder when less than the floor is left', () => {
    const gift = open({ price: 5000, amountFunded: 4980 });
    expect(minContributionFor(gift)).toBe(20);
    expect(validateContribution(gift, 20)).toMatchObject({ ok: true, amount: 20 });
  });

  it('refuses contributions to a completed or non-group gift', () => {
    expect(validateContribution(open({ amountFunded: 5000 }), 100).ok).toBe(false);
    expect(validateContribution(open({ isPurchased: true }), 100).ok).toBe(false);
    expect(validateContribution(single(), 100).ok).toBe(false);
  });

  it('refuses junk amounts', () => {
    expect(validateContribution(open(), NaN).ok).toBe(false);
    expect(validateContribution(open(), 0).ok).toBe(false);
    expect(validateContribution(open(), -50).ok).toBe(false);
  });
});

describe('contributionPresets', () => {
  it('offers ascending, unique amounts within what is left', () => {
    const presets = contributionPresets(open({ price: 5000 }));
    expect(presets.length).toBeGreaterThan(1);
    expect([...presets].sort((a, b) => a - b)).toEqual(presets);
    expect(new Set(presets).size).toBe(presets.length);
    expect(presets[0]).toBeGreaterThanOrEqual(DEFAULT_MIN_CONTRIBUTION);
    expect(presets[presets.length - 1]).toBe(5000);
  });

  it('every preset passes validation', () => {
    const gift = open({ price: 5000, amountFunded: 1234.56 });
    for (const preset of contributionPresets(gift)) {
      expect(validateContribution(gift, preset).ok).toBe(true);
    }
  });

  it('returns nothing once the gift is funded', () => {
    expect(contributionPresets(open({ price: 5000, amountFunded: 5000 }))).toEqual([]);
  });

  it('collapses to a single option when barely anything is left', () => {
    const presets = contributionPresets(open({ price: 5000, amountFunded: 4990 }));
    expect(presets).toEqual([10]);
  });
});

// Regression cover for a real bug: the cart and checkout summed `gift.price *
// quantity`. For a group gift `gift.price` is the GOAL, so a guest chipping in
// $500 toward a $5,000 honeymoon saw — and would have been charged — $5,000.
describe('cart line totals', () => {
  it('uses the stored line price, not the gift price', () => {
    const item = { price: 500, quantity: 1, gift: { price: 5000 } };
    expect(cartLineTotal(item)).toBe(500);
  });

  it('multiplies shares by the share price for a fixed split', () => {
    const item = { price: 1000, quantity: 2, gift: { price: 3000 } };
    expect(cartLineTotal(item)).toBe(2000);
  });

  it('still works for an ordinary gift line', () => {
    expect(cartLineTotal({ price: 1500, quantity: 2, gift: { price: 1500 } })).toBe(3000);
  });

  it('falls back to the gift price only when the line has none', () => {
    expect(cartLineTotal({ price: null, quantity: 2, gift: { price: 300 } })).toBe(600);
    expect(cartLineTotal({ quantity: 1, gift: undefined })).toBe(0);
  });

  it('sums a mixed cart of gifts and contributions', () => {
    const total = cartItemsTotal([
      { price: 1500, quantity: 2, gift: { price: 1500 } },
      { price: 500, quantity: 1, gift: { price: 5000 } },
      { price: 333.34, quantity: 3, gift: { price: 1000 } },
    ]);
    expect(total).toBe(4500.02);
  });

  it('is zero for an empty or missing cart', () => {
    expect(cartItemsTotal([])).toBe(0);
    expect(cartItemsTotal(undefined)).toBe(0);
  });
});

// The couple's headline "recaudado" figure. Before group gifts this was simply
// the sum of purchased gifts; a half-funded honeymoon is real money too, so
// counting all-or-nothing would under-report what they actually have coming.
describe('raisedAmount', () => {
  it('counts a bought single gift in full', () => {
    expect(raisedAmount([{ price: 800, isPurchased: true, giftType: 'SINGLE' }])).toBe(800);
  });

  it('ignores an unbought single gift', () => {
    expect(raisedAmount([{ price: 800, isPurchased: false, giftType: 'SINGLE' }])).toBe(0);
  });

  it('counts a partially funded group gift by what it has raised', () => {
    expect(
      raisedAmount([{ price: 5000, isPurchased: false, giftType: 'GROUP_OPEN', amountFunded: 1250 }]),
    ).toBe(1250);
  });

  it('counts a completed group gift by its funding, not its price', () => {
    expect(
      raisedAmount([{ price: 1000, isPurchased: true, giftType: 'GROUP_FIXED', amountFunded: 1000.02 }]),
    ).toBe(1000.02);
  });

  it('sums a mixed list', () => {
    const total = raisedAmount([
      { price: 800, isPurchased: true, giftType: 'SINGLE' },
      { price: 1200, isPurchased: false, giftType: 'SINGLE' },
      { price: 5000, isPurchased: false, giftType: 'GROUP_OPEN', amountFunded: 1500 },
      { price: 3000, isPurchased: true, giftType: 'GROUP_FIXED', amountFunded: 3000 },
    ]);
    expect(total).toBe(5300);
  });

  it('treats a gift with no type as an ordinary one (legacy rows)', () => {
    expect(raisedAmount([{ price: 500, isPurchased: true }])).toBe(500);
  });

  it('is zero for an empty or missing list', () => {
    expect(raisedAmount([])).toBe(0);
    expect(raisedAmount(undefined)).toBe(0);
  });
});
