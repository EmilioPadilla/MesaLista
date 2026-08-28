import { describe, it, expect } from 'vitest';

import {
  DEFAULT_MIN_CONTRIBUTION,
  MAX_CONTRIBUTOR_TARGET,
  fundingGoal,
  isFullyFunded,
  normalizeGiftType,
  priceContribution,
  shareAmount,
  sharesRemaining,
  type FundableGift,
} from './giftFunding.js';

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

const single = (over: Partial<FundableGift> = {}): FundableGift => ({
  price: 1500,
  giftType: 'SINGLE',
  amountFunded: 0,
  ...over,
});

// This file is a deliberate duplicate of packages/shared/src/utils/giftFunding.ts
// (same arrangement as paymentFees.ts). These assertions pin the numbers that
// BOTH copies must produce, so a change to one that isn't mirrored fails here.
describe('funding math parity with the shared client copy', () => {
  it('prices an evenly divisible share', () => {
    expect(shareAmount(fixed({ price: 3000, contributorTarget: 3 }))).toBe(1000);
  });

  it('rounds an uneven share UP and raises the goal to match', () => {
    const gift = fixed({ price: 1000, contributorTarget: 3 });
    expect(shareAmount(gift)).toBe(333.34);
    expect(fundingGoal(gift)).toBe(1000.02);
    expect(isFullyFunded({ ...gift, amountFunded: 1000.02 })).toBe(true);
  });

  it('treats an open gift goal as its price', () => {
    expect(fundingGoal(open({ price: 5000 }))).toBe(5000);
  });
});

describe('priceContribution — fixed splits', () => {
  it('prices one share', () => {
    expect(priceContribution(fixed(), { shares: 1 })).toMatchObject({ ok: true, price: 1000, quantity: 1 });
  });

  it('defaults to a single share when none is specified', () => {
    expect(priceContribution(fixed(), {})).toMatchObject({ ok: true, price: 1000, quantity: 1 });
  });

  it('lets one guest cover several shares in one line', () => {
    // price * quantity is what the guest is charged — 2 × $1,000.
    expect(priceContribution(fixed(), { shares: 2 })).toMatchObject({ ok: true, price: 1000, quantity: 2 });
  });

  it('refuses more shares than remain', () => {
    const gift = fixed({ amountFunded: 2000 });
    expect(sharesRemaining(gift)).toBe(1);
    const result = priceContribution(gift, { shares: 2 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('1 parte');
  });

  it('refuses a completed gift', () => {
    expect(priceContribution(fixed({ amountFunded: 3000 }), { shares: 1 }).ok).toBe(false);
    expect(priceContribution(fixed({ isPurchased: true }), { shares: 1 }).ok).toBe(false);
  });

  it('refuses junk share counts', () => {
    expect(priceContribution(fixed(), { shares: 0 }).ok).toBe(false);
    expect(priceContribution(fixed(), { shares: -2 }).ok).toBe(false);
    expect(priceContribution(fixed(), { shares: NaN }).ok).toBe(false);
  });
});

describe('priceContribution — open goals', () => {
  it('accepts an amount above the floor as a single unit', () => {
    expect(priceContribution(open(), { amount: 750 })).toMatchObject({ ok: true, price: 750, quantity: 1 });
  });

  // The client is never trusted to price anything; it only states intent.
  it('clamps an over-large amount down to what is left', () => {
    const gift = open({ price: 5000, amountFunded: 4000 });
    expect(priceContribution(gift, { amount: 99999 })).toMatchObject({ ok: true, price: 1000, quantity: 1 });
  });

  it('refuses an amount under the floor', () => {
    const result = priceContribution(open(), { amount: 5 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('mínima');
  });

  it('honours a couple-set minimum', () => {
    expect(priceContribution(open({ minContribution: 500 }), { amount: 100 }).ok).toBe(false);
    expect(priceContribution(open({ minContribution: 500 }), { amount: 500 }).ok).toBe(true);
  });

  it('lets the last sliver be funded even below the usual floor', () => {
    const gift = open({ price: 5000, amountFunded: 4985 });
    expect(DEFAULT_MIN_CONTRIBUTION).toBeGreaterThan(15);
    expect(priceContribution(gift, { amount: 15 })).toMatchObject({ ok: true, price: 15 });
  });

  it('refuses junk amounts', () => {
    expect(priceContribution(open(), {}).ok).toBe(false);
    expect(priceContribution(open(), { amount: 0 }).ok).toBe(false);
    expect(priceContribution(open(), { amount: -10 }).ok).toBe(false);
  });
});

describe('priceContribution — non-group gifts', () => {
  it('refuses to price a contribution to a normal gift', () => {
    expect(priceContribution(single(), { amount: 100 }).ok).toBe(false);
  });
});

describe('normalizeGiftType', () => {
  // The compatibility guarantee: clients that predate group gifts send no
  // giftType at all, and must keep creating ordinary gifts.
  it('defaults a payload with no giftType to SINGLE', () => {
    expect(normalizeGiftType({}, 1000)).toEqual({
      ok: true,
      value: { giftType: 'SINGLE', contributorTarget: null, minContribution: null },
    });
  });

  it('rejects an unknown gift type', () => {
    expect(normalizeGiftType({ giftType: 'POTLUCK' }, 1000).ok).toBe(false);
  });

  it('requires a valid share count for a fixed split', () => {
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED' }, 1000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED', contributorTarget: 1 }, 1000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED', contributorTarget: 2.5 }, 1000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED', contributorTarget: MAX_CONTRIBUTOR_TARGET + 1 }, 1000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED', contributorTarget: 3 }, 1000)).toEqual({
      ok: true,
      value: { giftType: 'GROUP_FIXED', contributorTarget: 3, minContribution: null },
    });
  });

  it('requires a positive goal for any group gift', () => {
    expect(normalizeGiftType({ giftType: 'GROUP_FIXED', contributorTarget: 3 }, 0).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN' }, 0).ok).toBe(false);
  });

  it('leaves an open gift minimum null when unset', () => {
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN' }, 5000)).toEqual({
      ok: true,
      value: { giftType: 'GROUP_OPEN', contributorTarget: null, minContribution: null },
    });
  });

  it('validates a supplied minimum against the goal', () => {
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN', minContribution: 0 }, 5000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN', minContribution: 6000 }, 5000).ok).toBe(false);
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN', minContribution: 250 }, 5000)).toEqual({
      ok: true,
      value: { giftType: 'GROUP_OPEN', contributorTarget: null, minContribution: 250 },
    });
  });

  // Switching a gift back to SINGLE has to CLEAR the group columns, or a stale
  // contributorTarget would resurface the next time the type changed.
  it('clears group fields when the type goes back to SINGLE', () => {
    expect(normalizeGiftType({ giftType: 'SINGLE', contributorTarget: 5, minContribution: 100 }, 1000)).toEqual({
      ok: true,
      value: { giftType: 'SINGLE', contributorTarget: null, minContribution: null },
    });
  });

  it('clears contributorTarget when switching a fixed split to an open goal', () => {
    expect(normalizeGiftType({ giftType: 'GROUP_OPEN', contributorTarget: 5 }, 1000)).toEqual({
      ok: true,
      value: { giftType: 'GROUP_OPEN', contributorTarget: null, minContribution: null },
    });
  });
});
