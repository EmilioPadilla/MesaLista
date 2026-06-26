import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGetCart, useUpdateCartItemQuantity, useRemoveGiftFromCart } from 'hooks/useCart';
import type { CartItem } from 'types/models/cart';

import { useGuestSession } from '@/guest/GuestSessionContext';
import { formatCurrency } from '@/lib/format';
import { cartItemsTotal } from '../utils';

export function CartScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { guestId } = useGuestSession();

  const { data: cart, isLoading } = useGetCart(guestId || undefined);
  const updateQuantity = useUpdateCartItemQuantity();
  const removeFromCart = useRemoveGiftFromCart();

  const items: CartItem[] = cart?.items ?? [];
  const total = cartItemsTotal(items);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Regalos</Text>
        </Pressable>
        <Text className="text-base font-semibold text-ink">Tu carrito</Text>
        <View className="w-16" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4704a" size="large" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base font-semibold text-ink">Tu carrito está vacío</Text>
          <Text className="mt-1 text-center text-sm text-mutedForeground">Agrega regalos para continuar.</Text>
          <Pressable
            onPress={() => router.replace(`/registry/${slug}/gifts`)}
            className="mt-5 rounded-full bg-oak px-5 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">Ver regalos</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerClassName="px-5 pb-4">
            {items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onIncrease={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                onDecrease={() =>
                  item.quantity <= 1
                    ? removeFromCart.mutate(item.id)
                    : updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                }
                onRemove={() => removeFromCart.mutate(item.id)}
              />
            ))}
          </ScrollView>

          <View className="border-t border-gray-200 bg-white px-5 pb-6 pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-mutedForeground">Subtotal</Text>
              <Text className="text-xl font-bold text-ink">{formatCurrency(total)}</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/registry/${slug}/checkout`)}
              className="mt-4 items-center rounded-full bg-oak py-3.5 active:bg-oakDark"
            >
              <Text className="text-base font-semibold text-white">Continuar al pago</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function CartRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const lineTotal = (item.gift?.price ?? 0) * item.quantity;
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-ml border border-gray-200 bg-white p-3">
      {item.gift?.imageUrl ? (
        <Image source={{ uri: item.gift.imageUrl }} className="h-16 w-16 rounded-lg bg-gray-100" resizeMode="cover" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Text className="text-2xl">🎁</Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={2}>
          {item.gift?.title}
        </Text>
        <Text className="mt-0.5 text-sm font-bold text-oak">{formatCurrency(lineTotal)}</Text>

        <View className="mt-2 flex-row items-center gap-3">
          <Pressable onPress={onDecrease} hitSlop={8} className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-lg font-bold text-oak">−</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">{item.quantity}</Text>
          <Pressable onPress={onIncrease} hitSlop={8} className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-lg font-bold text-oak">+</Text>
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8} className="ml-auto px-2 py-1">
            <Text className="text-sm font-medium text-danger">Quitar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
