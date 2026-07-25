import { describe, expect, it } from 'vitest';

import { validateGuestDetails, type GuestDetails } from './utils';

const validGuest: GuestDetails = {
  name: 'Ana Ruiz',
  email: 'ana@correo.com',
  phone: '5512345678',
};

describe('validateGuestDetails', () => {
  it('accepts a fully filled form', () => {
    expect(validateGuestDetails(validGuest)).toEqual({});
  });

  it('lets a guest check out without a phone number', () => {
    // App Store guideline 5.1.1(v): a gift purchase doesn't need the phone.
    expect(validateGuestDetails({ ...validGuest, phone: '' })).toEqual({});
    expect(validateGuestDetails({ ...validGuest, phone: '   ' })).toEqual({});
  });

  it('still checks the shape of a phone number that was typed', () => {
    expect(validateGuestDetails({ ...validGuest, phone: '12345' }).phone).toBe('Debe tener 10 dígitos');
    expect(validateGuestDetails({ ...validGuest, phone: '55 1234 5678' }).phone).toBeUndefined();
  });

  it('still requires the name and a well-formed email', () => {
    const errors = validateGuestDetails({ name: '  ', email: '', phone: '' });
    expect(errors.name).toBe('El nombre es requerido');
    expect(errors.email).toBe('El correo es requerido');
    expect(validateGuestDetails({ ...validGuest, email: 'not-an-email' }).email).toBe('Correo inválido');
  });
});
