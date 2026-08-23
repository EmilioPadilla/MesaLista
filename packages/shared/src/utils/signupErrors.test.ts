import { describe, expect, it } from 'vitest';

import { resolveSignupError, SIGNUP_ERROR_MESSAGES, SIGNUP_GENERIC_ERROR } from './signupErrors';

const apiError = (data: Record<string, unknown>) => ({ response: { data } });

describe('resolveSignupError', () => {
  it('maps the API code to Spanish copy', () => {
    expect(resolveSignupError(apiError({ code: 'EMAIL_TAKEN', error: 'whatever' }))).toEqual({
      code: 'EMAIL_TAKEN',
      message: SIGNUP_ERROR_MESSAGES.EMAIL_TAKEN,
    });
  });

  it('translates the legacy English duplicate from an older deployed API', () => {
    expect(resolveSignupError(apiError({ error: 'Email or slug already exists' }))).toEqual({
      code: 'EMAIL_OR_SLUG_TAKEN',
      message: SIGNUP_ERROR_MESSAGES.EMAIL_OR_SLUG_TAKEN,
    });
  });

  it('falls back to the generic message for unknown English text', () => {
    expect(resolveSignupError(apiError({ error: 'Something failed on our side' }))).toEqual({
      message: SIGNUP_GENERIC_ERROR,
    });
  });

  it('passes Spanish server copy through untouched', () => {
    expect(resolveSignupError(apiError({ error: 'Código de descuento expirado' }))).toEqual({
      message: 'Código de descuento expirado',
    });
  });

  it('handles network errors with no response body', () => {
    expect(resolveSignupError(new Error('Network Error'))).toEqual({ message: SIGNUP_GENERIC_ERROR });
  });
});
