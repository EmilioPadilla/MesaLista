import { describe, it, expect } from 'vitest';
import { comparePlans, discountedFixedPrice, FIXED_PLAN_PRICE_MXN, COMMISSION_RATE, PLAN_BREAK_EVEN_MXN } from './plans';

// TEST-W4 — the publish-time savings calculator. A wrong sign here tells couples
// the expensive plan is the cheaper one, so the break-even boundary is pinned
// exactly rather than approximately.

describe('plan constants', () => {
  it('breaks even at $66,667 MXN', () => {
    expect(PLAN_BREAK_EVEN_MXN).toBe(66667);
    expect(PLAN_BREAK_EVEN_MXN).toBe(Math.round(FIXED_PLAN_PRICE_MXN / COMMISSION_RATE));
  });
});

describe('comparePlans', () => {
  it('favours commission just below break-even', () => {
    const result = comparePlans(66666);
    expect(result.cheaper).toBe('commission');
    expect(result.fixedSavings).toBeLessThan(0);
  });

  it('favours the fixed plan just above break-even', () => {
    const result = comparePlans(66668);
    expect(result.cheaper).toBe('fixed');
    expect(result.fixedSavings).toBeGreaterThan(0);
  });

  it('resolves an exact tie to commission', () => {
    // At $100,000 with a $3,000 fixed price both plans cost the same. A tie
    // should not push a couple into paying up front, so `cheaper` requires
    // strictly positive savings.
    const result = comparePlans(100000, 3000);
    expect(result.fixedSavings).toBe(0);
    expect(result.cheaper).toBe('commission');
  });

  it('computes the commission cost on the goal', () => {
    expect(comparePlans(150000).commissionCost).toBeCloseTo(4500, 6);
    expect(comparePlans(150000).fixedSavings).toBeCloseTo(2500, 6);
  });

  it('treats a zero, negative or non-finite goal as zero', () => {
    for (const goal of [0, -100, NaN, Infinity]) {
      const result = comparePlans(goal);
      expect(result.commissionCost).toBe(0);
      expect(result.cheaper).toBe('commission');
    }
  });

  it('uses a discounted fixed price when one is supplied', () => {
    // At $1,000 the fixed plan pays for itself at half the usual registry total.
    const result = comparePlans(40000, 1000);
    expect(result.fixedCost).toBe(1000);
    expect(result.cheaper).toBe('fixed');
  });
});

describe('discountedFixedPrice', () => {
  it('returns the full price with no discount', () => {
    expect(discountedFixedPrice(null)).toBe(FIXED_PLAN_PRICE_MXN);
    expect(discountedFixedPrice()).toBe(FIXED_PLAN_PRICE_MXN);
  });

  it('applies a percentage discount', () => {
    expect(discountedFixedPrice({ discountType: 'PERCENTAGE', discountValue: 25 })).toBe(1500);
  });

  it('applies a fixed-amount discount', () => {
    expect(discountedFixedPrice({ discountType: 'FIXED_AMOUNT', discountValue: 300 })).toBe(1700);
  });

  it('never goes below zero', () => {
    expect(discountedFixedPrice({ discountType: 'FIXED_AMOUNT', discountValue: 5000 })).toBe(0);
    expect(discountedFixedPrice({ discountType: 'PERCENTAGE', discountValue: 150 })).toBe(0);
  });
});
