import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGiftListBySlug } from 'hooks/useGiftList';
import { useGetCart, useUpdateCartDetails } from 'hooks/useCart';
import { useCreateCheckoutSession, useCreatePayPalOrder, useCancelPayment } from 'hooks/usePayment';
import { useValidateRsvpCode, useInviteeByCode } from 'hooks/useRsvp';

import { useGuestSession } from '@/guest/GuestSessionContext';
import { useToast } from '@/lib/ToastProvider';
import { formatCurrency } from '@/lib/format';
import { buildReturnUrls, openCheckout, type PaymentMethod } from '../payment';
import { cartItemsTotal, computeCheckoutTotals, type FeePreference } from '../utils';

export function CheckoutScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const toast = useToast();
  const { guestId } = useGuestSession();

  const { data: cart, isLoading } = useGetCart(guestId || undefined);
  const { data: list } = useGiftListBySlug(slug);
  const updateCartDetails = useUpdateCartDetails();
  const createCheckoutSession = useCreateCheckoutSession();
  const createPayPalOrder = useCreatePayPalOrder();
  const cancelPayment = useCancelPayment();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [rsvpCode, setRsvpCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Debounce RSVP code, then validate + auto-fill the name.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(rsvpCode.trim().toUpperCase()), 500);
    return () => clearTimeout(timer);
  }, [rsvpCode]);

  const { data: validation, isLoading: validating } = useValidateRsvpCode(debouncedCode, !!debouncedCode);
  const { data: invitee } = useInviteeByCode(debouncedCode, validation?.valid === true);

  useEffect(() => {
    if (invitee && !name.trim()) setName(`${invitee.firstName} ${invitee.lastName}`.trim());
  }, [invitee, name]);

  const cartTotal = cartItemsTotal(cart?.items);
  const feePreference: FeePreference =
    (list as { feePreference?: FeePreference } | undefined)?.feePreference ?? 'couple';
  const totals = useMemo(() => computeCheckoutTotals(cartTotal, feePreference, method), [cartTotal, feePreference, method]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'El nombre es requerido';
    if (!email.trim()) next.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Correo inválido';
    if (!phone.trim()) next.phone = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) next.phone = 'Debe tener 10 dígitos';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePay = async () => {
    if (!method || !guestId || !cart?.id) return;
    if (!validate()) return;

    setProcessing(true);
    try {
      await updateCartDetails.mutateAsync({
        cartItemId: cart.id,
        details: {
          sessionId: cart.sessionId,
          inviteeName: name,
          inviteeEmail: email,
          phoneNumber: phone,
          message: message || undefined,
          rsvpCode: rsvpCode.trim() || undefined,
        },
      });

      const { redirect, successUrl, cancelUrl } = buildReturnUrls(method, { id: cart.id, sessionId: cart.sessionId });

      let checkoutUrl: string | undefined;
      if (method === 'stripe') {
        const res = await createCheckoutSession.mutateAsync({
          cartId: cart.id,
          orderId: String(cart.id),
          successUrl,
          cancelUrl,
        });
        checkoutUrl = res.url;
      } else {
        const res = await createPayPalOrder.mutateAsync({ cartId: cart.id, successUrl, cancelUrl });
        checkoutUrl = res.approvalUrl;
      }

      if (!checkoutUrl) {
        toast.error('No se pudo iniciar el pago');
        return;
      }

      const result = await openCheckout(checkoutUrl, redirect);
      if (result.status === 'cancel') {
        cancelPayment.mutate({ cartId: String(cart.id), paymentMethod: method.toUpperCase() });
        toast.info('Pago cancelado. Puedes intentar nuevamente.');
      } else if (result.status === 'success') {
        const params = new URLSearchParams({ cartSession: cart.sessionId, method, ...result.params });
        router.replace(`/registry/${slug}/confirmation?${params.toString()}`);
      }
    } catch {
      toast.error('Ocurrió un error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#d4704a" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Carrito</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-ink">Información del invitado</Text>
        <Text className="mt-1 text-sm text-mutedForeground">
          Para que {list?.coupleName ?? 'la pareja'} sepa quién les envía este regalo.
        </Text>

        <Field label="¿Tienes un código de invitación? (opcional)">
          <TextInput
            value={rsvpCode}
            onChangeText={(t) => setRsvpCode(t.toUpperCase())}
            placeholder="ABC12345"
            placeholderTextColor="#949ca4"
            autoCapitalize="characters"
            className="rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
          />
          {validating ? (
            <Text className="mt-1 text-xs text-gray-500">Validando…</Text>
          ) : validation?.valid === true && invitee ? (
            <Text className="mt-1 text-xs font-medium text-success">¡Hola {invitee.firstName}!</Text>
          ) : validation?.valid === false ? (
            <Text className="mt-1 text-xs text-warning">{validation.message} — puedes continuar de todas formas</Text>
          ) : null}
        </Field>

        <Field label="Nombre completo *" error={errors.name}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre completo"
            placeholderTextColor="#949ca4"
            className="rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
          />
        </Field>

        <Field label="Correo electrónico *" error={errors.email}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#949ca4"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
          />
        </Field>

        <Field label="Teléfono *" error={errors.phone}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="55 1234 5678"
            placeholderTextColor="#949ca4"
            keyboardType="phone-pad"
            className="rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
          />
        </Field>

        <Field label="Mensaje (opcional)">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={`Un mensaje para ${list?.coupleName ?? 'la pareja'}…`}
            placeholderTextColor="#949ca4"
            multiline
            numberOfLines={4}
            className="min-h-[96px] rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
            textAlignVertical="top"
          />
        </Field>

        {/* Summary */}
        <View className="mt-4 rounded-ml bg-muted p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-mutedForeground">Subtotal</Text>
            <Text className="text-base font-semibold text-ink">{formatCurrency(cartTotal)}</Text>
          </View>
          {method && feePreference === 'guest' ? (
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-mutedForeground">Comisión ({method === 'stripe' ? 'Tarjeta' : 'PayPal'})</Text>
              <Text className="text-base font-semibold text-ink">{formatCurrency(totals.currentFee)}</Text>
            </View>
          ) : null}
          <View className="mt-3 flex-row items-center justify-between border-t border-gray-200 pt-3">
            <Text className="text-base font-semibold text-ink">Total</Text>
            <Text className="text-xl font-bold text-oak">{formatCurrency(totals.finalTotal)}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text className="mt-5 text-base font-semibold text-ink">Método de pago</Text>
        <View className="mt-2 flex-row gap-3">
          <MethodButton label="Tarjeta" active={method === 'stripe'} onPress={() => setMethod('stripe')} />
          <MethodButton label="PayPal" active={method === 'paypal'} onPress={() => setMethod('paypal')} />
        </View>

        <Pressable
          disabled={!method || processing}
          onPress={handlePay}
          className={`mt-5 items-center rounded-full py-3.5 ${!method || processing ? 'bg-gray-300' : 'bg-oak active:bg-oakDark'}`}
        >
          {processing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {!method ? 'Selecciona un método de pago' : 'Continuar al pago'}
            </Text>
          )}
        </Pressable>

        <Text className="mt-3 text-center text-xs text-mutedForeground">Pagos 100% seguros · Stripe & PayPal</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      {children}
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

function MethodButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-ml border-2 py-3 ${active ? 'border-oak bg-oak/5' : 'border-gray-200 bg-white'}`}
    >
      <Text className={`text-sm font-bold ${active ? 'text-oak' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}
