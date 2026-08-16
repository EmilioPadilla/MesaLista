import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';

import { useCheckSlugAvailability, useSignupCommission } from 'hooks/useUser';
import { useSendVerificationCode, useVerifyCode } from 'hooks/useEmailVerification';
import {
  useCompletePlanIapSignup,
  useCompletePlanSignupSession,
  useCreatePlanCheckoutSession,
  usePreparePlanIapSignup,
} from 'hooks/usePayment';
import { useValidateDiscountCode } from 'hooks/useDiscountCode';
import { queryKeys } from 'hooks/queryKeys';
import type { User } from 'types/models/user';

import { useAuth } from '@/auth/AuthContext';
import { trackEvent, useScreenView } from '@/lib/analytics';
import { useToast } from '@/lib/ToastProvider';
import { tokenStore } from '@/lib/secureStore';
import { API_URL } from '@/lib/apiConfig';
import { openCheckout } from '@/features/guestRegistry/payment';
import { isIapAvailable, newIapUserId, purchaseFixedPlan } from '@/lib/revenuecat';
import { DateField } from '../components/DateField';
import { PasswordStrength } from '../components/PasswordStrength';
import {
  buildPlanReturnUrls,
  buildSlugFromNames,
  calculateDiscountedPrice,
  EMPTY_DETAILS,
  formatMxn,
  optionalPhone,
  sanitizeSlugInput,
  SIGNUP_STEPS,
  validateDetails,
  type DetailsErrors,
  type PlanChoice,
  type SignupDetails,
  type SignupStep,
} from '../utils';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

const TERMS_URL =
  'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Te%CC%81rminos%20y%20Condiciones%20MesaLista%20Mx.pdf';
const PRIVACY_URL =
  'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Aviso%20de%20Privacidad%20MesaLista%20Mx.pdf';

/**
 * Couple signup, mirroring the web flow (src/app/routes/Signup.tsx):
 * details → email verification → slug → plan → payment → success.
 *
 * Mobile-specific differences from web:
 * - Auth is Bearer-token based: commission signup stores the token from the
 *   response; the fixed plan signs in with the held credentials after the
 *   Stripe session is completed (that endpoint only sets a web cookie).
 * - Stripe checkout opens in an in-app browser and returns via the
 *   /payments/mobile-return deep-link bridge instead of a page redirect.
 */
export function SignupScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth();

  const [step, setStep] = useState<SignupStep>('details');
  const [details, setDetails] = useState<SignupDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [slug, setSlug] = useState('');
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanChoice>('');
  const [planError, setPlanError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successSlug, setSuccessSlug] = useState('');

  // On iOS the fixed plan must go through Apple IAP (App Store guideline 3.1.1);
  // discount codes can't apply to fixed StoreKit prices, so we hide that field.
  const iosIap = Platform.OS === 'ios' && isIapAvailable();
  const [iapUserId] = useState(newIapUserId);

  const { mutateAsync: signupCommission } = useSignupCommission();
  const { mutateAsync: createPlanCheckout } = useCreatePlanCheckoutSession();
  const { mutateAsync: completePlanSignup } = useCompletePlanSignupSession();
  const { mutateAsync: preparePlanIap } = usePreparePlanIapSignup();
  const { mutateAsync: completePlanIap } = useCompletePlanIapSignup();
  const { mutateAsync: sendVerificationCode, isPending: isResendingCode } = useSendVerificationCode();
  const { mutateAsync: verifyCode } = useVerifyCode();
  const { data: discountCodeInfo, isLoading: isValidatingDiscount, isError: isDiscountCodeError } = useValidateDiscountCode(discountCode);
  const { data: slugCheck, isLoading: isCheckingSlug } = useCheckSlugAvailability(debouncedSlug);

  const discountCodeValid = discountCodeInfo ? true : isDiscountCodeError ? false : null;
  const price = calculateDiscountedPrice(discountCodeValid ? discountCodeInfo : null, selectedPlan);

  useScreenView('/signup');

  // Keep the suggested slug in sync while names are being typed (web parity).
  useEffect(() => {
    const derived = buildSlugFromNames(details);
    if (derived) setSlug(derived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details.firstName, details.lastName, details.spouseFirstName, details.spouseLastName, details.isWeddingAccount]);

  // Debounce the slug before hitting the availability endpoint.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug && slug.length > 2) setDebouncedSlug(slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (slugCheck && step === 'slug') {
      setSlugError(slugCheck.available ? '' : 'Este enlace ya está en uso. Por favor elige otro.');
    }
  }, [slugCheck, step]);

  // Resend-code cooldown countdown.
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // After success, land in the authenticated app (web redirects to /{slug}).
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => router.replace('/(app)'), 6000);
    return () => clearTimeout(timer);
  }, [step, router]);

  // Someone already signed in shouldn't see signup — but only bounce before the
  // flow starts: mid-flow we authenticate the fresh account ourselves and want
  // to show the success step, not an abrupt redirect.
  if (step === 'details') {
    if (isAuthLoading) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator color="#d4704a" size="large" />
        </SafeAreaView>
      );
    }
    if (isAuthenticated) {
      return <Redirect href="/(app)" />;
    }
  }

  const setField = <K extends keyof SignupDetails>(key: K, value: SignupDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSendVerificationCode = async (withProfile: boolean) => {
    try {
      setIsLoading(true);
      await sendVerificationCode({
        email: details.email.trim(),
        ...(withProfile && {
          firstName: details.firstName,
          lastName: details.lastName,
          phone: optionalPhone(details.phone),
        }),
      });
      toast.success('Código de verificación enviado a tu correo');
      setResendTimer(60);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al enviar el código');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /** Sign in with the credentials held in the form. Returns whether it worked. */
  const tryLogin = async () => {
    try {
      await login(details.email.trim(), details.password);
      return true;
    } catch {
      return false;
    }
  };

  /** How this signup is being paid for — kept on every checkout event. */
  const paymentMethod = () => (selectedPlan !== 'fixed' ? 'commission' : iosIap ? 'apple_iap' : 'stripe');

  const goToSuccess = (finalSlug?: string) => {
    setSuccessSlug(finalSlug || slug);
    trackEvent('REGISTRY_PURCHASE', { plan: selectedPlan, slug: finalSlug || slug, method: paymentMethod() });
    setStep('success');
  };

  /**
   * iOS fixed-plan purchase via Apple IAP (RevenueCat). We stash the signup
   * server-side keyed by a RevenueCat app user id, run the native purchase, then
   * complete — the server re-verifies the entitlement before provisioning and
   * returns a Bearer token we store to sign in.
   */
  const handleFixedPlanIap = async () => {
    await preparePlanIap({
      appUserId: iapUserId,
      email: details.email.trim(),
      password: details.password,
      firstName: details.firstName,
      lastName: details.lastName,
      spouseFirstName: details.spouseFirstName || '',
      spouseLastName: details.spouseLastName || '',
      phoneNumber: optionalPhone(details.phone),
      slug,
      ...(details.eventDate && { eventDate: details.eventDate.toISOString() }),
    });

    const result = await purchaseFixedPlan(iapUserId);

    if (result.userCancelled) {
      toast.info('Pago cancelado. Puedes intentar nuevamente.');
      return;
    }
    if (!result.entitled) {
      toast.error('No se pudo verificar la compra. Por favor intenta de nuevo.');
      return;
    }

    try {
      const completed = await completePlanIap({ appUserId: iapUserId });
      // Web relies on the cookie; on mobile we store the returned Bearer token
      // (falling back to a login with the credentials we still hold).
      if (completed.token) {
        await tokenStore.set(completed.token);
        await queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
      } else if (!(await tryLogin())) {
        toast.warning('Tu cuenta fue creada. Inicia sesión para continuar.');
      }
      toast.success('¡Pago exitoso! Tu cuenta ha sido creada.');
      goToSuccess(completed.slug);
    } catch (completeError) {
      // The webhook backstop may have already provisioned the account and removed
      // the pending row (a race), so /complete 404s even though the account now
      // exists. Sign in with the credentials we hold and treat it as success;
      // only surface the error if there's genuinely no account to log into.
      if (await tryLogin()) {
        toast.success('¡Pago exitoso! Tu cuenta ha sido creada.');
        goToSuccess();
      } else {
        throw completeError;
      }
    }
  };

  const handleFixedPlanCheckout = async () => {
    const redirect = Linking.createURL('signup-return');
    const { successUrl, cancelUrl } = buildPlanReturnUrls(API_URL, redirect);

    const checkout = await createPlanCheckout({
      planType: 'FIXED',
      email: details.email.trim(),
      password: details.password,
      firstName: details.firstName,
      lastName: details.lastName,
      spouseFirstName: details.spouseFirstName || '',
      spouseLastName: details.spouseLastName || '',
      phoneNumber: optionalPhone(details.phone),
      slug,
      successUrl,
      cancelUrl,
      ...(details.eventDate && { eventDate: details.eventDate.toISOString() }),
      ...(discountCode && discountCodeValid && { discountCode }),
    });

    if (!checkout.success || !checkout.url) {
      toast.error('Error al crear la sesión de pago');
      return;
    }

    const result = await openCheckout(checkout.url, redirect);

    if (result.status === 'success' && result.params.session_id) {
      const completed = await completePlanSignup({ sessionId: result.params.session_id });
      // The completion endpoint authenticates via web cookie only; on mobile we
      // sign in with the credentials we still hold to get a Bearer token.
      const loggedIn = await tryLogin();
      if (!loggedIn) toast.warning('Tu cuenta fue creada. Inicia sesión para continuar.');
      toast.success('¡Pago exitoso! Tu cuenta ha sido creada.');
      goToSuccess(completed.slug);
    } else if (result.status === 'cancel') {
      toast.info('Pago cancelado. Puedes intentar nuevamente.');
    } else {
      // Browser closed without reaching our deep link. The charge may still
      // have gone through (the webhook provisions the account), so probe by
      // signing in before treating it as abandoned.
      if (await tryLogin()) {
        toast.success('¡Pago exitoso! Tu cuenta ha sido creada.');
        goToSuccess();
      } else {
        toast.info('No se completó el pago. Puedes intentar nuevamente.');
      }
    }
  };

  const handleCommissionSignup = async () => {
    const created = await signupCommission({
      email: details.email.trim(),
      password: details.password,
      firstName: details.firstName,
      lastName: details.lastName,
      spouseFirstName: details.spouseFirstName || '',
      spouseLastName: details.spouseLastName || '',
      phoneNumber: optionalPhone(details.phone),
      slug,
      role: 'COUPLE',
      ...(details.eventDate && { eventDate: details.eventDate.toISOString() }),
      ...(discountCode && discountCodeValid && { discountCode }),
    } as Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string; discountCode?: string; eventDate?: string });

    // The endpoint returns a session token in the body (web relies on the
    // cookie instead). Store it so the new account is signed in immediately;
    // fall back to a normal login for older deployed APIs without it.
    const token = (created as User & { token?: string }).token;
    if (token) {
      await tokenStore.set(token);
      await queryClient.invalidateQueries({ queryKey: [queryKeys.currentUser] });
    } else {
      await tryLogin();
    }

    toast.success('¡Cuenta creada exitosamente!');
    goToSuccess(created.slug);
  };

  const handleNext = async () => {
    switch (step) {
      case 'details': {
        const nextErrors = validateDetails(details);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        // Funnel entry, same point the web tracks it (plan/slug are picked in
        // later steps here, so they aren't known yet).
        trackEvent('REGISTRY_ATTEMPT', { slug });
        if (await handleSendVerificationCode(true)) setStep('verification');
        return;
      }

      case 'verification': {
        if (verificationCode.length !== 6) {
          setVerificationError('Ingresa el código de 6 dígitos');
          return;
        }
        setVerificationError('');
        try {
          setIsLoading(true);
          const result = await verifyCode({ email: details.email.trim(), code: verificationCode });
          if (result.success) {
            toast.success('¡Correo verificado exitosamente!');
            setStep('slug');
          } else {
            setVerificationError(result.error || 'Código inválido');
          }
        } catch (error: any) {
          setVerificationError(error?.response?.data?.error || 'Error al verificar el código');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      case 'slug': {
        if (!slug) {
          setSlugError('El enlace de la pareja es requerido');
          return;
        }
        if (isCheckingSlug) {
          setSlugError('Verificando disponibilidad...');
          return;
        }
        if (slugCheck && !slugCheck.available) {
          setSlugError('Este enlace ya está en uso. Por favor elige otro.');
          return;
        }
        setSlugError('');
        setStep('plan');
        return;
      }

      case 'plan': {
        if (!selectedPlan) {
          setPlanError('Selecciona un plan');
          return;
        }
        setPlanError('');
        setStep('payment');
        return;
      }

      case 'payment': {
        setIsLoading(true);
        trackEvent('START_CHECKOUT', { plan: selectedPlan, slug, method: paymentMethod() });
        try {
          if (selectedPlan === 'fixed') {
            if (iosIap) await handleFixedPlanIap();
            else await handleFixedPlanCheckout();
          } else await handleCommissionSignup();
        } catch (error: any) {
          // User endpoints report `error`; payment endpoints report `message`;
          // thrown RevenueCat/StoreKit errors only carry `.message` — surface it
          // so IAP failures aren't swallowed into a generic toast.
          const data = error?.response?.data;
          const reason = data?.error || data?.message || error?.message;
          trackEvent('CHECKOUT_ERROR', { plan: selectedPlan, slug, method: paymentMethod(), error: reason });
          toast.error(reason || 'Error al procesar la solicitud. Por favor intenta de nuevo.');
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'verification':
        setStep('details');
        break;
      case 'slug':
        setStep('verification');
        break;
      case 'plan':
        setStep('slug');
        break;
      case 'payment':
        setStep('plan');
        break;
      default:
        if (router.canGoBack()) router.back();
        else router.replace('/welcome');
    }
  };

  const stepNumber = SIGNUP_STEPS.indexOf(step) + 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {step !== 'success' && (
        <View className="flex-row items-center px-5 pb-2 pt-3">
          <Pressable onPress={handleBack} hitSlop={8} disabled={isLoading}>
            <Text className="text-base text-oak">‹ Atrás</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled">
          {step !== 'success' && (
            <View className="mb-6">
              <Text className="mb-2 text-sm text-mutedForeground">Paso {stepNumber} de {SIGNUP_STEPS.length}</Text>
              <View className="h-1 rounded-full bg-gray-200">
                <View className="h-1 rounded-full bg-oak" style={{ width: `${(stepNumber / SIGNUP_STEPS.length) * 100}%` }} />
              </View>
            </View>
          )}

          {step === 'details' && (
            <DetailsStep
              details={details}
              errors={errors}
              setField={setField}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              discountCodeValid={discountCodeValid}
              discountCodeInfo={discountCodeInfo}
              isValidatingDiscount={isValidatingDiscount}
              showDiscountField={!iosIap}
            />
          )}

          {step === 'verification' && (
            <VerificationStep
              email={details.email}
              code={verificationCode}
              error={verificationError}
              onChangeCode={(value) => {
                setVerificationCode(value.replace(/\D/g, '').slice(0, 6));
                setVerificationError('');
              }}
              resendTimer={resendTimer}
              isResending={isResendingCode}
              onResend={() => {
                if (resendTimer > 0) return;
                handleSendVerificationCode(false);
              }}
            />
          )}

          {step === 'slug' && (
            <SlugStep
              slug={slug}
              onChangeSlug={(value) => setSlug(sanitizeSlugInput(value))}
              error={slugError}
              isChecking={isCheckingSlug}
              available={!isCheckingSlug && slugCheck?.available === true}
            />
          )}

          {step === 'plan' && (
            <PlanStep
              selectedPlan={selectedPlan}
              onSelect={(plan) => {
                setSelectedPlan(plan);
                setPlanError('');
              }}
              error={planError}
              discountApplied={!!(discountCodeValid && discountCodeInfo)}
              discountCode={discountCodeInfo?.code}
              price={calculateDiscountedPrice(discountCodeValid ? discountCodeInfo : null, 'fixed')}
            />
          )}

          {step === 'payment' && (
            <PaymentStep
              selectedPlan={selectedPlan}
              iosIap={iosIap}
              discountApplied={!!(discountCodeValid && discountCodeInfo && price.savings > 0)}
              discountCode={discountCodeInfo?.code}
              discountLabel={
                discountCodeInfo?.discountType === 'PERCENTAGE' ? `${discountCodeInfo.discountValue}% descuento` : 'Descuento fijo'
              }
              price={price}
            />
          )}

          {step === 'success' && <SuccessStep slug={successSlug || slug} onContinue={() => router.replace('/(app)')} />}

          {step !== 'success' && (
            <Pressable
              onPress={handleNext}
              disabled={isLoading}
              className={`mt-8 items-center rounded-full py-4 ${isLoading ? 'bg-gray-300' : 'bg-oak active:bg-oakDark'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {step === 'payment'
                    ? selectedPlan === 'fixed'
                      ? `Pagar ${formatMxn(price.discounted)}`
                      : 'Crear Cuenta'
                    : 'Continuar →'}
                </Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------------------------- steps ---------------------------------- */

function DetailsStep({
  details,
  errors,
  setField,
  discountCode,
  setDiscountCode,
  discountCodeValid,
  discountCodeInfo,
  isValidatingDiscount,
  showDiscountField,
}: {
  details: SignupDetails;
  errors: DetailsErrors;
  setField: <K extends keyof SignupDetails>(key: K, value: SignupDetails[K]) => void;
  discountCode: string;
  setDiscountCode: (value: string) => void;
  discountCodeValid: boolean | null;
  discountCodeInfo: { discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'; discountValue: number } | undefined;
  isValidatingDiscount: boolean;
  showDiscountField: boolean;
}) {
  return (
    <View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        Únete a MesaLista
      </Text>
      <Text className="mb-6 mt-2 text-center text-base text-mutedForeground">
        Necesitamos algunos datos para crear tu cuenta
      </Text>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Nombre" error={errors.firstName}>
            <Input value={details.firstName} onChangeText={(v) => setField('firstName', v)} placeholder="María" />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Apellido" error={errors.lastName}>
            <Input value={details.lastName} onChangeText={(v) => setField('lastName', v)} placeholder="González" />
          </Field>
        </View>
      </View>

      <CheckRow
        checked={details.isWeddingAccount}
        onToggle={() => setField('isWeddingAccount', !details.isWeddingAccount)}
        label={<Text className="text-sm text-foreground">Crear cuenta para boda</Text>}
      />

      {details.isWeddingAccount && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Nombre de tu pareja" error={errors.spouseFirstName}>
              <Input value={details.spouseFirstName} onChangeText={(v) => setField('spouseFirstName', v)} placeholder="Juan" />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Apellido de tu pareja" error={errors.spouseLastName}>
              <Input value={details.spouseLastName} onChangeText={(v) => setField('spouseLastName', v)} placeholder="Pérez" />
            </Field>
          </View>
        </View>
      )}

      <Field label="Correo Electrónico" error={errors.email}>
        <Input
          value={details.email}
          onChangeText={(v) => setField('email', v)}
          placeholder="maria@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Field>

      <Field label="Teléfono (opcional)" error={errors.phone}>
        <Input
          value={details.phone}
          onChangeText={(v) => setField('phone', v)}
          placeholder="55 1234 5678"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </Field>

      <Field label="Fecha del evento" error={errors.eventDate}>
        <DateField value={details.eventDate} onChange={(date) => setField('eventDate', date)} />
      </Field>

      {showDiscountField && (
        <Field label="Código de descuento (opcional)">
          <Input
            value={discountCode}
            onChangeText={(v) => setDiscountCode(v.toUpperCase())}
            placeholder="CODIGO2024"
            autoCapitalize="characters"
          />
          {discountCodeValid === true && discountCodeInfo && (
            <View className="mt-2 rounded-ml border border-success/30 bg-success/10 p-3">
              <Text className="text-sm text-success">
                ✓ Código válido:{' '}
                {discountCodeInfo.discountType === 'PERCENTAGE'
                  ? `${discountCodeInfo.discountValue}% de descuento`
                  : `$${discountCodeInfo.discountValue} MXN de descuento`}
              </Text>
            </View>
          )}
          {isValidatingDiscount && <Text className="mt-1 text-xs text-info">Validando...</Text>}
          {discountCodeValid === false && <Text className="mt-1 text-sm text-danger">Código de descuento inválido o expirado</Text>}
        </Field>
      )}

      <Field label="Contraseña" error={errors.password}>
        <Input
          value={details.password}
          onChangeText={(v) => setField('password', v)}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
      </Field>
      <PasswordStrength password={details.password} />

      <Field label="Confirmar Contraseña" error={errors.confirmPassword}>
        <Input
          value={details.confirmPassword}
          onChangeText={(v) => setField('confirmPassword', v)}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
      </Field>

      <CheckRow
        checked={details.termsAccepted}
        onToggle={() => setField('termsAccepted', !details.termsAccepted)}
        label={
          <Text className="flex-1 text-sm text-foreground">
            Acepto los{' '}
            <Text className="text-oak underline" onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
              Términos y Condiciones
            </Text>{' '}
            y la{' '}
            <Text className="text-oak underline" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
              Política de Privacidad
            </Text>
          </Text>
        }
      />
      {errors.termsAccepted && <Text className="mt-1 text-sm text-danger">{errors.termsAccepted}</Text>}
    </View>
  );
}

function VerificationStep({
  email,
  code,
  error,
  onChangeCode,
  resendTimer,
  isResending,
  onResend,
}: {
  email: string;
  code: string;
  error: string;
  onChangeCode: (value: string) => void;
  resendTimer: number;
  isResending: boolean;
  onResend: () => void;
}) {
  return (
    <View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        Verifica tu correo
      </Text>
      <Text className="mt-2 text-center text-base text-mutedForeground">Enviamos un código de 6 dígitos a</Text>
      <Text className="mb-6 mt-1 text-center text-base font-medium text-oak">{email}</Text>

      <Field label="Código de verificación" error={error}>
        <TextInput
          value={code}
          onChangeText={onChangeCode}
          placeholder="000000"
          placeholderTextColor="#949ca4"
          keyboardType="number-pad"
          maxLength={6}
          className={`rounded-ml border bg-white px-4 py-4 text-center text-2xl tracking-[8px] text-ink ${
            error ? 'border-danger' : 'border-gray-200'
          }`}
        />
      </Field>

      <View className="mt-4 rounded-ml bg-info/10 p-3">
        <Text className="text-center text-sm text-info">El código expira en 10 minutos</Text>
      </View>

      <View className="mt-5 items-center">
        <Text className="mb-1 text-sm text-mutedForeground">¿No recibiste el código?</Text>
        <Pressable onPress={onResend} disabled={resendTimer > 0 || isResending} hitSlop={8}>
          <Text className={`text-sm font-medium ${resendTimer > 0 || isResending ? 'text-gray-400' : 'text-oak'}`}>
            {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : isResending ? 'Reenviando...' : 'Reenviar código'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SlugStep({
  slug,
  onChangeSlug,
  error,
  isChecking,
  available,
}: {
  slug: string;
  onChangeSlug: (value: string) => void;
  error: string;
  isChecking: boolean;
  available: boolean;
}) {
  return (
    <View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        Tu enlace personalizado
      </Text>
      <Text className="mb-6 mt-2 text-center text-base text-mutedForeground">
        Este será el enlace único de tu mesa de regalos
      </Text>

      <View className="mb-5 rounded-ml bg-muted p-5">
        <Text className="mb-1 text-center text-sm text-mutedForeground">Tu enlace será:</Text>
        <Text className="text-center text-base">
          <Text className="text-mutedForeground">mesalista.com.mx/</Text>
          <Text className="font-semibold text-oak">{slug}</Text>
        </Text>
      </View>

      <Field label="Personalizar enlace" error={error}>
        <Input value={slug} onChangeText={onChangeSlug} placeholder="maria-gonzalez" autoCapitalize="none" hasError={!!error} />
        {isChecking && <Text className="mt-1 text-sm text-mutedForeground">Verificando disponibilidad...</Text>}
        {available && <Text className="mt-1 text-sm text-success">✓ Este enlace está disponible</Text>}
      </Field>

      <View className="mt-4">
        <Text className="text-xs text-mutedForeground">• Solo letras, números y guiones</Text>
        <Text className="mt-1 text-xs text-mutedForeground">• Debe ser único y fácil de recordar</Text>
        <Text className="mt-1 text-xs text-mutedForeground">• Podrás cambiarlo más tarde si quieres</Text>
      </View>
    </View>
  );
}

function PlanStep({
  selectedPlan,
  onSelect,
  error,
  discountApplied,
  discountCode,
  price,
}: {
  selectedPlan: PlanChoice;
  onSelect: (plan: 'fixed' | 'commission') => void;
  error: string;
  discountApplied: boolean;
  discountCode: string | undefined;
  price: { discounted: number; savings: number };
}) {
  const showDiscount = discountApplied && price.savings > 0;
  return (
    <View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        Elige tu plan
      </Text>
      <Text className="mb-6 mt-2 text-center text-base text-mutedForeground">
        Selecciona la opción que mejor se adapte a ti
      </Text>

      <PlanCard
        selected={selectedPlan === 'fixed'}
        onPress={() => onSelect('fixed')}
        emoji="💳"
        title="Plan Fijo"
        priceNode={
          showDiscount ? (
            <View className="items-end">
              <Text className="text-xs text-mutedForeground line-through">{formatMxn(2000)}</Text>
              <Text className="text-xl font-bold text-success">{formatMxn(price.discounted)}</Text>
            </View>
          ) : (
            <Text className="text-xl font-bold text-oak">{formatMxn(2000)}</Text>
          )
        }
        subtitle="Pago único"
        features={[
          '1 Mesa de regalos ilimitada',
          'Sin comisiones por regalos',
          'Gestión de RSVP',
          'Soporte al cliente',
          'Listas de regalos inspiradas por nosotros',
        ]}
        extra={
          showDiscount ? (
            <View className="mt-2 rounded-ml border border-success/30 bg-success/10 p-2">
              <Text className="text-xs font-medium text-success">
                Código &quot;{discountCode}&quot; aplicado — Ahorras {formatMxn(price.savings)}
              </Text>
            </View>
          ) : null
        }
      />

      <PlanCard
        selected={selectedPlan === 'commission'}
        onPress={() => onSelect('commission')}
        emoji="📈"
        title="Plan por Comisión"
        priceNode={<Text className="text-xl font-bold text-success">3.00%</Text>}
        subtitle="Comisión de 3.00% por cada venta"
        features={[
          '1 Mesa de regalos ilimitada',
          'Sin costo inicial',
          'Gestión de RSVP',
          'Soporte al cliente',
          'Listas de regalos inspiradas por nosotros',
        ]}
      />

      {!!error && <Text className="mt-2 text-sm text-danger">{error}</Text>}

      <View className="mt-4 rounded-ml bg-info/10 p-3">
        <Text className="text-center text-sm text-info">ⓘ Una vez elegido tu plan, no podrás cambiarlo</Text>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  emoji,
  title,
  priceNode,
  subtitle,
  features,
  extra,
}: {
  selected: boolean;
  onPress: () => void;
  emoji: string;
  title: string;
  priceNode: React.ReactNode;
  subtitle: string;
  features: string[];
  extra?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`mb-4 rounded-2xl border-2 p-4 ${selected ? 'border-oak bg-oak/5' : 'border-gray-200 bg-white'}`}
    >
      <View className="flex-row items-center">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-oak/10">
          <Text className="text-xl">{emoji}</Text>
        </View>
        <View className="flex-1 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-ink">{title}</Text>
          {priceNode}
        </View>
        {selected && (
          <View className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-oak">
            <Text className="text-xs font-bold text-white">✓</Text>
          </View>
        )}
      </View>
      <Text className="mt-1 text-sm text-mutedForeground">{subtitle}</Text>
      {extra}
      <View className="mt-2">
        {features.map((f) => (
          <Text key={f} className="mt-1 text-sm text-mutedForeground">
            • {f}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

function PaymentStep({
  selectedPlan,
  iosIap,
  discountApplied,
  discountCode,
  discountLabel,
  price,
}: {
  selectedPlan: PlanChoice;
  iosIap?: boolean;
  discountApplied: boolean;
  discountCode: string | undefined;
  discountLabel: string;
  price: { discounted: number; savings: number };
}) {
  return (
    <View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        {selectedPlan === 'fixed' ? 'Confirmar pago' : 'Confirmar cuenta'}
      </Text>
      <Text className="mb-6 mt-2 text-center text-base text-mutedForeground">
        {selectedPlan === 'fixed'
          ? discountApplied
            ? `Pago único de ${formatMxn(price.discounted)}`
            : `Pago único de ${formatMxn(2000)}`
          : 'Sin costo inicial - 3% por venta'}
      </Text>

      {selectedPlan === 'fixed' ? (
        <View>
          <View className="rounded-ml bg-muted p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-ink">Plan Fijo</Text>
              {discountApplied ? (
                <View className="items-end">
                  <Text className="text-xs text-mutedForeground line-through">{formatMxn(2000)}</Text>
                  <Text className="text-xl font-bold text-success">{formatMxn(price.discounted)}</Text>
                </View>
              ) : (
                <Text className="text-xl font-bold text-oak">{formatMxn(2000)}</Text>
              )}
            </View>

            {discountApplied && (
              <View className="mt-3 rounded-ml border border-success/30 bg-success/10 p-3">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-medium text-success">Código de descuento aplicado</Text>
                    <Text className="text-xs text-success">&quot;{discountCode}&quot;</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-medium text-success">-{formatMxn(price.savings)}</Text>
                    <Text className="text-xs text-success">{discountLabel}</Text>
                  </View>
                </View>
              </View>
            )}

            <Text className="mt-3 text-sm text-mutedForeground">Pago único, sin comisiones adicionales</Text>
          </View>

          <Text className="mt-5 text-center text-sm text-mutedForeground">
            {iosIap ? 'Se abrirá la ventana de compra de App Store' : 'Se abrirá nuestro procesador de pagos seguro'}
          </Text>
          <Text className="mt-2 text-center text-xs text-mutedForeground">
            {iosIap ? '⚡ Compra procesada de forma segura por Apple' : '⚡ Procesamiento seguro con cifrado SSL'}
          </Text>
        </View>
      ) : (
        <View className="rounded-ml bg-success/10 p-6">
          <Text className="text-center text-3xl">✓</Text>
          <Text className="mt-2 text-center text-base font-semibold text-ink">Sin costo inicial</Text>
          <Text className="mt-1 text-center text-sm text-mutedForeground">
            Solo pagarás el 3% cuando tengas ventas en tu mesa de regalos
          </Text>
        </View>
      )}
    </View>
  );
}

function SuccessStep({ slug, onContinue }: { slug: string; onContinue: () => void }) {
  return (
    <View className="items-center pt-10">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <Text className="text-4xl text-success">✓</Text>
      </View>
      <Text className="text-center text-3xl text-ink" style={{ fontFamily: serif }}>
        ¡Cuenta creada exitosamente!
      </Text>
      <Text className="mt-3 text-center text-base text-mutedForeground">
        Tu mesa de regalos está lista. Te llevaremos a tu cuenta en unos segundos.
      </Text>
      <View className="mt-6 w-full rounded-ml bg-info/10 p-4">
        <Text className="text-center text-sm text-info">Tu enlace: mesalista.com.mx/{slug}</Text>
      </View>
      <Pressable onPress={onContinue} className="mt-8 w-full items-center rounded-full bg-oak py-4 active:bg-oakDark">
        <Text className="text-base font-semibold text-white">Ir a mi mesa de regalos</Text>
      </Pressable>
    </View>
  );
}

/* -------------------------------- primitives ------------------------------- */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      {children}
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

function Input({ hasError, ...props }: React.ComponentProps<typeof TextInput> & { hasError?: boolean }) {
  return (
    <TextInput
      placeholderTextColor="#949ca4"
      className={`rounded-ml border bg-white px-4 py-3 text-base text-ink ${hasError ? 'border-danger' : 'border-gray-200'}`}
      {...props}
    />
  );
}

function CheckRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: React.ReactNode }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="mt-4 flex-row items-center gap-2.5"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${checked ? 'border-oak bg-oak' : 'border-gray-300 bg-white'}`}
      >
        {checked && <Text className="text-xs font-bold text-white">✓</Text>}
      </View>
      {label}
    </Pressable>
  );
}
