/**
 * Pure signup-flow logic shared by the screen and its tests. Mirrors the web
 * flow in src/app/routes/Signup.tsx — keep validation rules, slug generation
 * and pricing in sync with it. One deliberate divergence: the phone number is
 * optional here (App Store guideline 5.1.1(v)) while web still requires it.
 */

export type SignupStep = 'details' | 'verification' | 'slug' | 'plan' | 'payment' | 'success';

export const SIGNUP_STEPS: SignupStep[] = ['details', 'verification', 'slug', 'plan', 'payment', 'success'];

export type PlanChoice = 'fixed' | 'commission' | '';

export const FIXED_PLAN_PRICE = 2000;

export interface SignupDetails {
  firstName: string;
  lastName: string;
  isWeddingAccount: boolean;
  spouseFirstName: string;
  spouseLastName: string;
  email: string;
  phone: string;
  eventDate: Date | null;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export const EMPTY_DETAILS: SignupDetails = {
  firstName: '',
  lastName: '',
  isWeddingAccount: false,
  spouseFirstName: '',
  spouseLastName: '',
  email: '',
  phone: '',
  eventDate: null,
  password: '',
  confirmPassword: '',
  termsAccepted: false,
};

/** Same shape the discount validation endpoint returns. */
export interface DiscountInfo {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

/** Lowercase and collapse whitespace to dashes (slug charset is enforced server-side). */
export function sanitizeSlugInput(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Default registry slug: "maria-gonzalez", or "maria-y-juan" once both spouse
 * names are present on a wedding account (same rule as the web form).
 */
export function buildSlugFromNames(d: Pick<SignupDetails, 'firstName' | 'lastName' | 'isWeddingAccount' | 'spouseFirstName' | 'spouseLastName'>): string {
  const first = d.firstName.trim();
  const last = d.lastName.trim();
  if (!first || !last) return '';
  if (d.isWeddingAccount && d.spouseFirstName.trim() && d.spouseLastName.trim()) {
    return sanitizeSlugInput(`${first} y ${d.spouseFirstName.trim()}`);
  }
  return sanitizeSlugInput(`${first} ${last}`);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-\+\(\)]{10,}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export type DetailsErrors = Partial<Record<keyof SignupDetails, string>>;

/** Field-level validation replicating the web form's antd rules. */
export function validateDetails(d: SignupDetails): DetailsErrors {
  const errors: DetailsErrors = {};

  if (!d.firstName.trim()) errors.firstName = 'El nombre es requerido';
  if (!d.lastName.trim()) errors.lastName = 'El apellido es requerido';

  if (d.isWeddingAccount) {
    if (!d.spouseFirstName.trim()) errors.spouseFirstName = 'El nombre de tu pareja es requerido';
    if (!d.spouseLastName.trim()) errors.spouseLastName = 'El apellido de tu pareja es requerido';
  }

  if (!d.email.trim()) errors.email = 'El correo electrónico es requerido';
  else if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Correo electrónico inválido';

  // Optional: App Store guideline 5.1.1(v) forbids requiring personal data that
  // isn't needed for the core flow. Only the format is checked when filled in.
  if (d.phone.trim() && !PHONE_RE.test(d.phone.trim())) errors.phone = 'Teléfono inválido';

  if (!d.eventDate) errors.eventDate = 'La fecha del evento es requerida';
  else if (startOfDay(d.eventDate) < startOfDay(new Date())) errors.eventDate = 'La fecha no puede ser en el pasado';

  if (!d.password) errors.password = 'La contraseña es requerida';
  else if (d.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (!PASSWORD_RE.test(d.password)) errors.password = 'Debe incluir mayúsculas, minúsculas y números';

  if (!d.confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';
  else if (d.password !== d.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

  if (!d.termsAccepted) errors.termsAccepted = 'Debes aceptar los términos y condiciones';

  return errors;
}

/**
 * Trimmed phone, or `undefined` when the couple left it blank — the payloads
 * JSON-serialize, so an undefined value drops the key instead of sending an
 * empty string the API would store verbatim.
 */
export function optionalPhone(phone: string): string | undefined {
  return phone.trim() || undefined;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface PasswordStrength {
  score: number; // 0-4
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/** Same scoring as the web PasswordStrengthIndicator. */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const score = Math.min(
    [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length,
    4,
  );
  return { score, hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar };
}

export function passwordStrengthLabel(score: number): string {
  if (score <= 1) return 'Muy débil';
  if (score === 2) return 'Débil';
  if (score === 3) return 'Buena';
  return 'Muy segura';
}

export interface DiscountedPrice {
  original: number;
  discounted: number;
  savings: number;
}

/** Fixed-plan price after an (already validated) discount code. */
export function calculateDiscountedPrice(discountInfo: DiscountInfo | null | undefined, selectedPlan: PlanChoice): DiscountedPrice {
  const basePrice = FIXED_PLAN_PRICE;
  if (!discountInfo || selectedPlan !== 'fixed') {
    return { original: basePrice, discounted: basePrice, savings: 0 };
  }

  const discounted =
    discountInfo.discountType === 'PERCENTAGE'
      ? basePrice - (basePrice * discountInfo.discountValue) / 100
      : basePrice - discountInfo.discountValue;

  const clamped = Math.max(0, discounted);
  return { original: basePrice, discounted: clamped, savings: basePrice - clamped };
}

export function formatMxn(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}

/**
 * Return URLs for the fixed-plan Stripe checkout. Stripe only substitutes a
 * LITERAL `{CHECKOUT_SESSION_ID}` placeholder, so the success URL is assembled
 * by hand instead of URLSearchParams (which would percent-encode the braces).
 * Both point at the backend bridge, which 302s to our `redirect` deep link.
 */
export function buildPlanReturnUrls(apiUrl: string, redirect: string): { successUrl: string; cancelUrl: string } {
  const base = `${apiUrl}/payments/mobile-return?redirect=${encodeURIComponent(redirect)}`;
  return {
    successUrl: `${base}&status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}&status=cancel`,
  };
}
