import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGetCart } from 'hooks/useCart';
import { useCapturePayPalPayment } from 'hooks/usePayment';
import type { CartItem } from 'types/models/cart';

import { useGuestSession } from '@/guest/GuestSessionContext';
import { formatCurrency } from '@/lib/format';
import { cartItemsTotal } from '../utils';

interface OrderConfirmationScreenProps {
  slug: string;
  cartSession?: string;
  method?: string;
  /** PayPal order id (returned as `token`). */
  paypalToken?: string;
  payerId?: string;
}

export function OrderConfirmationScreen({ slug, cartSession, method, paypalToken, payerId }: OrderConfirmationScreenProps) {
  const router = useRouter();
  const { regenerateGuestId } = useGuestSession();
  const capturePayPal = useCapturePayPalPayment();

  // Poll the cart until the backend marks it PAID (Stripe webhook / PayPal capture).
  const { data: cart, isLoading } = useGetCart(cartSession || undefined, {
    refetchInterval: (query) => ((query.state.data as { status?: string } | undefined)?.status === 'PAID' ? false : 2000),
  });

  const isPaid = cart?.status === 'PAID';
  const capturedRef = useRef(false);
  const regeneratedRef = useRef(false);

  // PayPal completes client-side: capture the approved order once.
  useEffect(() => {
    if (method === 'paypal' && paypalToken && payerId && cart && !isPaid && !capturedRef.current) {
      capturedRef.current = true;
      capturePayPal.mutate({ orderId: paypalToken });
    }
  }, [method, paypalToken, payerId, cart, isPaid, capturePayPal]);

  // Start a clean cart for the next purchase once this one is paid.
  useEffect(() => {
    if (isPaid && !regeneratedRef.current) {
      regeneratedRef.current = true;
      regenerateGuestId();
    }
  }, [isPaid, regenerateGuestId]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerClassName="flex-grow items-center justify-center px-8 py-12">
        {isLoading || (!isPaid && !cart) ? (
          <>
            <ActivityIndicator color="#d4704a" size="large" />
            <Text className="mt-4 text-base text-mutedForeground">Confirmando tu pago…</Text>
          </>
        ) : isPaid ? (
          <View className="w-full items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <Text className="text-4xl">🎉</Text>
            </View>
            <Text className="mt-5 text-2xl font-bold text-ink">¡Gracias por tu regalo!</Text>
            <Text className="mt-2 text-center text-sm text-mutedForeground">
              Tu pago se procesó correctamente. La pareja recibirá una notificación con tu mensaje.
            </Text>

            <View className="mt-6 w-full rounded-ml border border-gray-200 bg-white p-4">
              {(cart?.items as CartItem[] | undefined)?.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between py-1">
                  <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                    {item.quantity}× {item.gift?.title}
                  </Text>
                  <Text className="ml-3 text-sm font-semibold text-ink">
                    {formatCurrency((item.gift?.price ?? 0) * item.quantity)}
                  </Text>
                </View>
              ))}
              <View className="mt-2 flex-row items-center justify-between border-t border-gray-200 pt-2">
                <Text className="text-base font-semibold text-ink">Total</Text>
                <Text className="text-base font-bold text-oak">
                  {formatCurrency(cart?.totalAmount ?? cartItemsTotal(cart?.items))}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.replace(`/registry/${slug}`)}
              className="mt-6 w-full items-center rounded-full bg-oak py-3.5 active:bg-oakDark"
            >
              <Text className="text-base font-semibold text-white">Volver a la mesa</Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-warning/15">
              <Text className="text-4xl">⏳</Text>
            </View>
            <Text className="mt-5 text-xl font-bold text-ink">Estamos confirmando tu pago</Text>
            <Text className="mt-2 text-center text-sm text-mutedForeground">
              Esto puede tardar unos segundos. Si ya completaste el pago, vuelve a la mesa en un momento.
            </Text>
            <Pressable
              onPress={() => router.replace(`/registry/${slug}/checkout`)}
              className="mt-6 w-full items-center rounded-full border border-oak bg-white py-3.5"
            >
              <Text className="text-base font-semibold text-oak">Volver al pago</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
