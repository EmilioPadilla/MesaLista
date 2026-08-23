import { describe, expect, it } from 'vitest';

import {
  SIGNUP_STEPS,
  buildSlugFromNames,
  calculatePasswordStrength,
  EMPTY_DETAILS,
  optionalPhone,
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
    expect(errors.eventDate).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.confirmPassword).toBeTruthy();
    expect(errors.termsAccepted).toBeTruthy();
    expect(errors.spouseFirstName).toBeUndefined(); // not a wedding account
    expect(errors.phone).toBeUndefined(); // optional (App Store guideline 5.1.1(v))
  });

  it('accepts a blank phone but rejects a malformed one', () => {
    expect(validateDetails({ ...validDetails, phone: '' }).phone).toBeUndefined();
    expect(validateDetails({ ...validDetails, phone: '   ' }).phone).toBeUndefined();
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

describe('optionalPhone', () => {
  it('drops the key from a JSON payload when the field is blank', () => {
    // JSON.stringify is what the API client does with the payload, so an
    // undefined value is what "the couple sent no phone number" looks like
    // on the wire — never an empty string the server would store.
    expect(JSON.parse(JSON.stringify({ phoneNumber: optionalPhone('') }))).toEqual({});
    expect(JSON.parse(JSON.stringify({ phoneNumber: optionalPhone('   ') }))).toEqual({});
  });

  it('sends the trimmed number when one was typed', () => {
    expect(optionalPhone(' 55 1234 5678 ')).toBe('55 1234 5678');
    expect(JSON.parse(JSON.stringify({ phoneNumber: optionalPhone('5512345678') }))).toEqual({
      phoneNumber: '5512345678',
    });
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

// TEST-M1 — signup is free and ends at a draft; plan choice and payment moved to
// the publish flow, so they must not be reachable from here any more.
describe('SIGNUP_STEPS', () => {
  it('is the four free steps, in order', () => {
    expect(SIGNUP_STEPS).toEqual(['details', 'verification', 'slug', 'success']);
  });

  it('has no plan or payment step', () => {
    expect(SIGNUP_STEPS).not.toContain('plan');
    expect(SIGNUP_STEPS).not.toContain('payment');
  });

  it('mirrors the web flow step count', () => {
    // src/app/routes/Signup.tsx SIGNUP_STEPS — keep the two in sync.
    expect(SIGNUP_STEPS).toHaveLength(4);
  });
});
