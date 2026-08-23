/**
 * Spanish copy for signup failures, shared by the web and mobile signup flows.
 *
 * The API now answers a duplicate with Spanish text and a machine-readable
 * `code`, but the deployed API lags this repo, so the older English strings
 * ("Email or slug already exists") are mapped here too. Anything unrecognised
 * falls back to a generic message rather than showing raw server English.
 */

export type SignupErrorCode = 'EMAIL_TAKEN' | 'SLUG_TAKEN' | 'EMAIL_OR_SLUG_TAKEN';

export const SIGNUP_ERROR_MESSAGES: Record<SignupErrorCode, string> = {
  EMAIL_TAKEN: 'Ya existe una cuenta con este correo electrónico. Inicia sesión o regístrate con otro correo.',
  SLUG_TAKEN: 'Ese enlace ya está ocupado. Elige otro para tu mesa de regalos.',
  EMAIL_OR_SLUG_TAKEN: 'Ese correo electrónico o enlace ya está en uso. Inicia sesión, o prueba con otro correo o enlace.',
};

export const SIGNUP_GENERIC_ERROR = 'No pudimos crear tu cuenta. Por favor intenta de nuevo.';

/** Legacy English responses from an older deployed API, by exact text. */
const LEGACY_CODES: Record<string, SignupErrorCode> = {
  'email or slug already exists': 'EMAIL_OR_SLUG_TAKEN',
  'email already exists': 'EMAIL_TAKEN',
  'slug already exists': 'SLUG_TAKEN',
};

const LEGACY_MESSAGES: Record<string, string> = {
  'failed to create account': SIGNUP_GENERIC_ERROR,
  'failed to create user': SIGNUP_GENERIC_ERROR,
  'email, password, first name, last name, and slug are required':
    'Faltan datos obligatorios: correo, contraseña, nombre, apellido y enlace.',
};

/** Anything that still reads as English is replaced by the generic message. */
const looksEnglish = (text: string) => /\b(already|exists|failed|required|invalid|unauthorized|not found)\b/i.test(text);

/**
 * Turns whatever the signup endpoint returned into something worth showing a
 * couple: what went wrong, in Spanish, and what they can do next. The `code`
 * lets the flow send them back to the field that actually collided.
 */
export function resolveSignupError(error: unknown): { code?: SignupErrorCode; message: string } {
  const data = (error as { response?: { data?: { code?: string; error?: string; message?: string } } } | undefined)?.response?.data;

  const code = data?.code;
  if (code && code in SIGNUP_ERROR_MESSAGES) {
    return { code: code as SignupErrorCode, message: SIGNUP_ERROR_MESSAGES[code as SignupErrorCode] };
  }

  const raw = (data?.error || data?.message || '').trim();
  if (!raw) {
    return { message: SIGNUP_GENERIC_ERROR };
  }

  const normalized = raw.toLowerCase();

  const legacyCode = LEGACY_CODES[normalized];
  if (legacyCode) {
    return { code: legacyCode, message: SIGNUP_ERROR_MESSAGES[legacyCode] };
  }

  const legacyMessage = LEGACY_MESSAGES[normalized];
  if (legacyMessage) {
    return { message: legacyMessage };
  }

  return { message: looksEnglish(raw) ? SIGNUP_GENERIC_ERROR : raw };
}

/** Message-only shorthand for callers that do not act on the code. */
export function resolveSignupErrorMessage(error: unknown): string {
  return resolveSignupError(error).message;
}
