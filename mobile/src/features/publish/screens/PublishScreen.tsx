import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';

import { useGiftListById, usePublishGiftList, useUpdateGiftList } from 'hooks/useGiftList';
import { useCurrentUser } from 'hooks/useUser';
import {
  useCompletePlanIapSignup,
  useCompletePlanSignupSession,
  useCreatePlanCheckoutSession,
  usePreparePlanIapSignup,
} from 'hooks/usePayment';
import { useValidateDiscountCode } from 'hooks/useDiscountCode';
import { queryKeys } from 'hooks/queryKeys';

import { trackEvent, useScreenView } from '@/lib/analytics';
import { useToast } from '@/lib/ToastProvider';
import { API_URL } from '@/lib/apiConfig';
import { openCheckout } from '@/features/guestRegistry/payment';
import { iapUserIdForUser, isIapAvailable, purchaseFixedPlan } from '@/lib/revenuecat';
import {
  buildPlanReturnUrls,
  calculateDiscountedPrice,
  checkPublishReadiness,
  comparePlans,
  COMMISSION_LABEL,
  formatMxn,
  PLAN_BREAK_EVEN_MXN,
} from '../utils';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

/**
 * Publish flow: the paywall, moved out of signup.
 *
 * By the time a couple gets here they have a registry they can look at, which is
 * the whole point of the re-sequencing. The goal input turns the plan comparison
 * into their own arithmetic rather than an abstract table.
 *
 * The fixed plan still goes through Apple IAP (App Store guideline 3.1.1) — the
 * purchase moved screens, it did not go away. Unlike the old signup flow the
 * couple is already authenticated, so the purchase is keyed on their real user
 * id and the server publishes the existing draft rather than creating anything.
 */
export function PublishScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useCurrentUser();
  const { data: giftList, isLoading: isLoadingList } = useGiftListById(listId);

  const [goalInput, setGoalInput] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Drafts are created hidden, so this is the couple's first real say on
  // visibility. Checked by default: a registry reaching this screen is built and
  // about to be paid for, which is what search results are for.
  const [isPublic, setIsPublic] = useState(true);

  const { mutateAsync: publishGiftList } = usePublishGiftList();
  const { mutateAsync: updateGiftList } = useUpdateGiftList();
  const { mutateAsync: createPlanCheckout } = useCreatePlanCheckoutSession();
  const { mutateAsync: completePlanSignup } = useCompletePlanSignupSession();
  const { mutateAsync: preparePlanIap } = usePreparePlanIapSignup();
  const { mutateAsync: completePlanIap } = useCompletePlanIapSignup();
  const { data: discountCodeInfo, isError: isDiscountCodeError } = useValidateDiscountCode(discountCode);

  useScreenView('/publish');

  // Discount codes can't apply to fixed StoreKit prices, so hide the field on IAP.
  const iosIap = Platform.OS === 'ios' && isIapAvailable();
  const discountCodeValid = discountCodeInfo ? true : isDiscountCodeError ? false : null;
  const price = calculateDiscountedPrice(discountCodeValid && !iosIap ? discountCodeInfo : null, 'fixed');

  const gifts = giftList?.gifts ?? [];
  const readiness = checkPublishReadiness({ giftCount: gifts.length, eventDate: giftList?.eventDate, coverImageUrl: giftList?.imageUrl });

  const goal = Number(goalInput.replace(/[^\d]/g, ''));
  const comparison = useMemo(() => comparePlans(goal, price.discounted), [goal, price.discounted]);
  const hasGoal = goal > 0;

  const paymentMethod = () => (iosIap ? 'apple_iap' : 'stripe');

  /**
   * Writes the visibility choice to the draft before it goes live.
   *
   * Done as a separate update rather than a publish argument because the fixed
   * plan publishes server-side (RevenueCat/Stripe webhook), possibly after this
   * screen is gone — setting it on the draft first is the one mechanism that
   * works for both plans. The value is inert until `publishedAt` is stamped, so
   * an abandoned purchase leaves nothing visible.
   */
  const applyVisibility = () => updateGiftList({ id: listId, data: { isPublic } });

  const onPublished = (plan: 'FIXED' | 'COMMISSION') => {
    trackEvent('REGISTRY_PUBLISHED', { plan, giftListId: listId, method: plan === 'FIXED' ? paymentMethod() : 'commission' });
    queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById, listId] });
    queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
    toast.success('¡Tu mesa de regalos ya está publicada!');
    router.replace(`/(app)/list/${listId}`);
  };

  const handlePublishCommission = async () => {
    setIsLoading(true);
    try {
      await applyVisibility();
      await publishGiftList(listId);
      onPublished('COMMISSION');
    } catch (error: any) {
      const data = error?.response?.data;
      toast.error(data?.error || data?.message || 'No pudimos publicar tu mesa. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * iOS fixed plan via Apple IAP. We stash the intent server-side keyed by the
   * couple's RevenueCat app user id, run the native purchase, then complete —
   * the server re-verifies the entitlement with RevenueCat before publishing.
   */
  const handleFixedPlanIap = async () => {
    if (!user) return;
    const appUserId = iapUserIdForUser(user.id);

    await preparePlanIap({ appUserId, giftListId: listId });

    const result = await purchaseFixedPlan(appUserId);

    if (result.userCancelled) {
      toast.info('Pago cancelado. Puedes intentar nuevamente.');
      return;
    }
    if (!result.entitled) {
      toast.error('No se pudo verificar la compra. Por favor intenta de nuevo.');
      return;
    }

    try {
      await completePlanIap({ appUserId });
      onPublished('FIXED');
    } catch (completeError: any) {
      // The webhook backstop may have already published and removed the pending
      // row (a race), so /complete 404s even though the list is now live. Re-read
      // it before surfacing an error the couple can't act on.
      const refreshed = await queryClient.fetchQuery({ queryKey: [queryKeys.giftListById, listId] }).catch(() => null);
      if (refreshed && (refreshed as { publishedAt?: string | null }).publishedAt) {
        onPublished('FIXED');
      } else {
        throw completeError;
      }
    }
  };

  const handleFixedPlanCheckout = async () => {
    const redirect = Linking.createURL('payment-return');
    const { successUrl, cancelUrl } = buildPlanReturnUrls(API_URL, redirect);

    const checkout = await createPlanCheckout({
      planType: 'FIXED',
      giftListId: listId,
      successUrl,
      cancelUrl,
      ...(discountCode && discountCodeValid && { discountCode }),
    });

    if (!checkout.success || !checkout.url) {
      toast.error('Error al crear la sesión de pago');
      return;
    }

    const result = await openCheckout(checkout.url, redirect);

    if (result.status === 'success' && result.params.session_id) {
      await completePlanSignup({ sessionId: result.params.session_id });
      onPublished('FIXED');
    } else if (result.status === 'cancel') {
      toast.info('Pago cancelado. Tu mesa sigue como borrador.');
    } else {
      // Browser closed without reaching our deep link. The charge may still have
      // gone through (the webhook publishes), so re-read before giving up.
      const refreshed = await queryClient.fetchQuery({ queryKey: [queryKeys.giftListById, listId] }).catch(() => null);
      if (refreshed && (refreshed as { publishedAt?: string | null }).publishedAt) {
        onPublished('FIXED');
      } else {
        toast.info('No se completó el pago. Puedes intentar nuevamente.');
      }
    }
  };

  const handlePublishFixed = async () => {
    setIsLoading(true);
    trackEvent('START_CHECKOUT', { plan: 'FIXED', giftListId: listId, method: paymentMethod() });
    try {
      await applyVisibility();
      if (iosIap) await handleFixedPlanIap();
      else await handleFixedPlanCheckout();
    } catch (error: any) {
      // User endpoints report `error`; payment endpoints report `message`; thrown
      // RevenueCat/StoreKit errors only carry `.message` — surface it so IAP
      // failures aren't swallowed into a generic toast.
      const data = error?.response?.data;
      const reason = data?.error || data?.message || error?.message;
      trackEvent('CHECKOUT_ERROR', { plan: 'FIXED', giftListId: listId, method: paymentMethod(), error: reason });
      toast.error(reason || 'Error al procesar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingList) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#d4704a" size="large" />
      </SafeAreaView>
    );
  }

  if (giftList?.publishedAt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <Text className="mb-2 text-center text-xl" style={{ fontFamily: serif }}>
          Tu mesa ya está publicada
        </Text>
        <Text className="mb-6 text-center text-base text-mutedForeground">No hace falta hacer nada más.</Text>
        <Pressable onPress={() => router.replace(`/(app)/list/${listId}`)} className="rounded-full bg-oak px-8 py-3">
          <Text className="text-base font-semibold text-white">Ver mi mesa</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8} disabled={isLoading}>
          <Text className="text-base text-oak">‹ Atrás</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="mb-2 mt-4 text-3xl" style={{ fontFamily: serif }}>
          Publica tu mesa
        </Text>
        <Text className="mb-6 text-base text-mutedForeground">
          Elige cómo quieres pagar. Puedes cambiar de opinión hasta que publiques.
        </Text>

        {!readiness.ready && (
          <View className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
            <Text className="mb-2 text-base font-semibold text-amber-900">Antes de publicar te falta:</Text>
            {readiness.missing.map((item) => (
              <Text key={item} className="text-sm text-amber-800">
                • {item}
              </Text>
            ))}
          </View>
        )}

        {/* Goal input — turns the comparison into the couple's own numbers */}
        <View className="mb-6 rounded-2xl bg-muted p-4">
          <Text className="mb-2 text-sm font-medium">¿Cuánto esperas recibir en regalos?</Text>
          <TextInput
            value={goalInput}
            onChangeText={setGoalInput}
            keyboardType="number-pad"
            placeholder="150,000"
            className="rounded-xl border border-border bg-white px-4 py-3 text-base"
          />
          {hasGoal ? (
            <Text className={`mt-3 text-sm ${comparison.cheaper === 'fixed' ? 'text-success' : 'text-oak'}`}>
              {comparison.cheaper === 'fixed'
                ? `Con esa meta, el Plan Fijo te ahorra ${formatMxn(comparison.fixedSavings)}.`
                : `Con esa meta, el Plan por Comisión te sale más barato por ${formatMxn(Math.abs(comparison.fixedSavings))}.`}
            </Text>
          ) : (
            <Text className="mt-3 text-sm text-mutedForeground">
              A partir de {formatMxn(PLAN_BREAK_EVEN_MXN)} el Plan Fijo sale más barato.
            </Text>
          )}
        </View>

        {/* Visibility — drafts are hidden, so this is where the couple chooses */}
        <Pressable
          onPress={() => setIsPublic((prev) => !prev)}
          disabled={isLoading}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isPublic }}
          className="mb-6 rounded-2xl bg-muted p-4"
        >
          <View className="flex-row items-start">
            <View
              className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                isPublic ? 'border-oak bg-oak' : 'border-border bg-white'
              }`}
            >
              {isPublic && <Text className="text-sm font-bold text-white">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium">Mostrar mi mesa en la búsqueda pública de MesaLista</Text>
              <Text className="mt-1 text-xs text-mutedForeground">
                Tu enlace funciona igual la elijas o no — solo cambia si aparece en nuestra búsqueda. Puedes cambiarlo cuando
                quieras desde Configuración.
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Fixed plan */}
        <View className="mb-4 rounded-2xl border-2 border-border p-5">
          <Text className="mb-1 text-lg font-semibold">Plan Fijo</Text>
          <Text className="mb-1 text-2xl font-bold text-oak">{formatMxn(price.discounted)}</Text>
          <Text className="mb-3 text-sm text-mutedForeground">Pago único, sin comisiones por regalo</Text>
          {hasGoal && <Text className="mb-3 text-sm">Pagas {formatMxn(price.discounted)} en total.</Text>}
          <Text className="text-sm text-mutedForeground">• Te quedas con el 100% de los regalos</Text>
          <Text className="text-sm text-mutedForeground">• Precio único, sin importar cuánto recibas</Text>
          <Text className="mb-4 text-sm text-mutedForeground">• Gestión de RSVP e invitaciones</Text>
          <Pressable
            onPress={handlePublishFixed}
            disabled={isLoading || !readiness.ready}
            className={`items-center rounded-full py-3.5 ${isLoading || !readiness.ready ? 'bg-gray-300' : 'bg-oak active:bg-oakDark'}`}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-semibold text-white">Pagar y publicar</Text>}
          </Pressable>
        </View>

        {/* Commission plan */}
        <View className="mb-6 rounded-2xl border-2 border-border p-5">
          <Text className="mb-1 text-lg font-semibold">Plan por Comisión</Text>
          <Text className="mb-1 text-2xl font-bold text-success">{COMMISSION_LABEL}</Text>
          <Text className="mb-3 text-sm text-mutedForeground">Sin costo inicial, pagas solo cuando recibes</Text>
          {hasGoal && <Text className="mb-3 text-sm">Pagarías {formatMxn(comparison.commissionCost)} sobre esa meta.</Text>}
          <Text className="text-sm text-mutedForeground">• Publicas hoy sin pagar nada</Text>
          <Text className="text-sm text-mutedForeground">• Solo cobramos sobre lo que recibas</Text>
          <Text className="mb-4 text-sm text-mutedForeground">• Gestión de RSVP e invitaciones</Text>
          <Pressable
            onPress={handlePublishCommission}
            disabled={isLoading || !readiness.ready}
            className={`items-center rounded-full border-2 py-3.5 ${
              isLoading || !readiness.ready ? 'border-gray-300' : 'border-oak active:bg-muted'
            }`}
          >
            <Text className={`text-base font-semibold ${isLoading || !readiness.ready ? 'text-gray-400' : 'text-oak'}`}>
              Publicar gratis
            </Text>
          </Pressable>
        </View>

        {/* Apple sets IAP prices, so a discount code can't apply on iOS. */}
        {!iosIap && (
          <View>
            <Text className="mb-2 text-sm font-medium">¿Tienes un código de descuento?</Text>
            <TextInput
              value={discountCode}
              onChangeText={(value) => setDiscountCode(value.toUpperCase())}
              autoCapitalize="characters"
              placeholder="CODIGO"
              className="rounded-xl border border-border bg-white px-4 py-3 text-base"
            />
            {discountCodeValid === true && <Text className="mt-2 text-sm text-success">Código aplicado al Plan Fijo</Text>}
            {discountCodeValid === false && discountCode.length > 2 && <Text className="mt-2 text-sm text-red-500">Código no válido</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
