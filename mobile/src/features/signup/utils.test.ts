import { describe, expect, it } from 'vitest';

import {
  buildPlanReturnUrls,
  buildSlugFromNames,
  calculateDiscountedPrice,
  calculatePasswordStrength,
  EMPTY_DETAILS,
  passwordStrengthLabel,
  sanitizeSlugInput,
  validateDetails,
  type SignupDetails,
} from './utils';

const validDetails: SignupDetails = {
  ...EMPTY_DETAILS,
  firstName: 'María',
  lastName: 'González',
  email: 'maria@correo.com',
  phone: '55 1234 5678',
  eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  password: 'Segura123',
  confirmPassword: 'Segura123',
  termsAccepted: true,
};

describe('buildSlugFromNames', () => {
  it('builds first-last slug for individual accounts', () => {
    expect(buildSlugFromNames(validDetails)).toBe('maría-gonzález');
  });

  it('uses first-y-spouse once both spouse names exist on wedding accounts', () => {
    expect(
      buildSlugFromNames({ ...validDetails, isWeddingAccount: true, spouseFirstName: 'Juan', spouseLastName: 'Pérez' }),
    ).toBe('maría-y-juan');
  });

  it('falls back to first-last while spouse names are incomplete', () => {
    expect(buildSlugFromNames({ ...validDetails, isWeddingAccount: true, spouseFirstName: 'Juan', spouseLastName: '' })).toBe(
      'maría-gonzález',
    );
  });

  it('collapses inner whitespace to dashes and returns empty without both names', () => {
    expect(buildSlugFromNames({ ...validDetails, firstName: 'Ana Sofía', lastName: 'de la Cruz' })).toBe('ana-sofía-de-la-cruz');
    expect(buildSlugFromNames({ ...validDetails, lastName: '' })).toBe('');
  });
});

describe('sanitizeSlugInput', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(sanitizeSlugInput('Maria Gonzalez')).toBe('maria-gonzalez');
  });
});

describe('validateDetails', () => {
  it('accepts a fully valid form', () => {
    expect(validateDetails(validDetails)).toEqual({});
  });

  it('requires all base fields', () => {
    const errors = validateDetails(EMPTY_DETAILS);
    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.eventDate).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.confirmPassword).toBeTruthy();
    expect(errors.termsAccepted).toBeTruthy();
    expect(errors.spouseFirstName).toBeUndefined(); // not a wedding account
  });

  it('requires spouse names only for wedding accounts', () => {
    const errors = validateDetails({ ...validDetails, isWeddingAccount: true });
    expect(errors.spouseFirstName).toBeTruthy();
    expect(errors.spouseLastName).toBeTruthy();
  });

  it('rejects malformed email and short phone', () => {
    expect(validateDetails({ ...validDetails, email: 'not-an-email' }).email).toBe('Correo electrónico inválido');
    expect(validateDetails({ ...validDetails, phone: '12345' }).phone).toBe('Teléfono inválido');
  });

  it('enforces the password policy (min 8, upper+lower+digit)', () => {
    expect(validateDetails({ ...validDetails, password: 'Ab1', confirmPassword: 'Ab1' }).password).toMatch(/8 caracteres/);
    expect(validateDetails({ ...validDetails, password: 'alllowercase1', confirmPassword: 'alllowercase1' }).password).toMatch(
      /mayúsculas/,
    );
    expect(validateDetails({ ...validDetails, password: 'Segura123', confirmPassword: 'Segura124' }).confirmPassword).toBe(
      'Las contraseñas no coinciden',
    );
  });

  it('rejects past event dates but accepts today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(validateDetails({ ...validDetails, eventDate: yesterday }).eventDate).toBeTruthy();
    expect(validateDetails({ ...validDetails, eventDate: new Date() }).eventDate).toBeUndefined();
  });
});

describe('calculatePasswordStrength', () => {
  it('scores 0 for empty and 4 when all requirements met', () => {
    expect(calculatePasswordStrength('').score).toBe(0);
    expect(calculatePasswordStrength('Segura123!').score).toBe(4);
  });

  it('reports individual requirements', () => {
    const s = calculatePasswordStrength('abcdefgh');
    expect(s.hasMinLength).toBe(true);
    expect(s.hasLowercase).toBe(true);
    expect(s.hasUppercase).toBe(false);
    expect(s.hasNumber).toBe(false);
    expect(s.hasSpecialChar).toBe(false);
    expect(s.score).toBe(2);
  });

  it('labels scores like the web indicator', () => {
    expect(passwordStrengthLabel(1)).toBe('Muy débil');
    expect(passwordStrengthLabel(2)).toBe('Débil');
    expect(passwordStrengthLabel(3)).toBe('Buena');
    expect(passwordStrengthLabel(4)).toBe('Muy segura');
  });
});

describe('calculateDiscountedPrice', () => {
  it('returns base price without a discount or on the commission plan', () => {
    expect(calculateDiscountedPrice(null, 'fixed')).toEqual({ original: 2000, discounted: 2000, savings: 0 });
    expect(
      calculateDiscountedPrice({ code: 'X', discountType: 'PERCENTAGE', discountValue: 50 }, 'commission'),
    ).toEqual({ original: 2000, discounted: 2000, savings: 0 });
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
    const { successUrl, cancelUrl } = buildPlanReturnUrls('https://api.example.com/api', 'mesalista://signup-return');
    expect(successUrl).toBe(
      'https://api.example.com/api/payments/mobile-return?redirect=mesalista%3A%2F%2Fsignup-return&status=success&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(cancelUrl).toBe('https://api.example.com/api/payments/mobile-return?redirect=mesalista%3A%2F%2Fsignup-return&status=cancel');
  });
});
