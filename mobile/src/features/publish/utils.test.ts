import { describe, expect, it } from 'vitest';

import { buildPlanReturnUrls, calculateDiscountedPrice, checkPublishReadiness } from './utils';

// TEST-M2 — publish-flow logic. The readiness cases mirror
// src/features/publish/utils/readiness.test.ts on web against the same fixtures,
// so the two surfaces can't drift on what they tell a couple is missing.

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
const cover = 'https://cdn.mesalista.com.mx/covers/abc.jpg';

describe('checkPublishReadiness', () => {
  it('is ready with at least one gift, a future event date and a cover image', () => {
    expect(checkPublishReadiness({ giftCount: 1, eventDate: future, coverImageUrl: cover })).toEqual({ ready: true, missing: [] });
  });

  it('blocks an empty registry and names the gap', () => {
    expect(checkPublishReadiness({ giftCount: 0, eventDate: future, coverImageUrl: cover })).toEqual({
      ready: false,
      missing: ['Agrega al menos un regalo'],
    });
  });

  it('blocks a missing event date', () => {
    expect(checkPublishReadiness({ giftCount: 3, eventDate: null, coverImageUrl: cover })).toEqual({
      ready: false,
      missing: ['Elige la fecha de tu evento'],
    });
  });

  it('blocks a registry with no cover image', () => {
    expect(checkPublishReadiness({ giftCount: 3, eventDate: future, coverImageUrl: null })).toEqual({
      ready: false,
      missing: ['Agrega una imagen de portada'],
    });
  });

  it('treats a past date as unset', () => {
    expect(checkPublishReadiness({ giftCount: 3, eventDate: past, coverImageUrl: cover }).ready).toBe(false);
  });

  it('lists every gap, gifts first and the cover last', () => {
    expect(checkPublishReadiness({ giftCount: 0, eventDate: null }).missing).toEqual([
      'Agrega al menos un regalo',
      'Elige la fecha de tu evento',
      'Agrega una imagen de portada',
    ]);
  });
});

describe('calculateDiscountedPrice', () => {
  it('returns base price without a discount or on the commission plan', () => {
    expect(calculateDiscountedPrice(null, 'fixed')).toEqual({ original: 2000, discounted: 2000, savings: 0 });
    expect(calculateDiscountedPrice({ code: 'X', discountType: 'PERCENTAGE', discountValue: 50 }, 'commission')).toEqual({
      original: 2000,
      discounted: 2000,
      savings: 0,
    });
  });

  it('applies percentage and fixed-amount discounts', () => {
    expect(calculateDiscountedPrice({ code: 'X', discountType: 'PERCENTAGE', discountValue: 25 }, 'fixed')).toEqual({
      original: 2000,
      discounted: 1500,
      savings: 500,
    });
    expect(calculateDiscountedPrice({ code: 'X', discountType: 'FIXED_AMOUNT', discountValue: 300 }, 'fixed')).toEqual({
      original: 2000,
      discounted: 1700,
      savings: 300,
    });
  });

  it('never discounts below zero', () => {
    expect(calculateDiscountedPrice({ code: 'X', discountType: 'FIXED_AMOUNT', discountValue: 5000 }, 'fixed')).toEqual({
      original: 2000,
      discounted: 0,
      savings: 2000,
    });
  });
});

describe('buildPlanReturnUrls', () => {
  it('keeps the Stripe session placeholder literal and encodes the redirect', () => {
    const { successUrl, cancelUrl } = buildPlanReturnUrls('https://api.example.com/api', 'mesalista://payment-return');
    expect(successUrl).toBe(
      'https://api.example.com/api/payments/mobile-return?redirect=mesalista%3A%2F%2Fpayment-return&status=success&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(cancelUrl).toBe('https://api.example.com/api/payments/mobile-return?redirect=mesalista%3A%2F%2Fpayment-return&status=cancel');
  });
});
