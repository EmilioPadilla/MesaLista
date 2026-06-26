import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGiftListBySlug } from 'hooks/useGiftList';
import { useGetCart, useAddGiftToCart, useUpdateCartItemQuantity, useRemoveGiftFromCart } from 'hooks/useCart';
import type { Gift } from 'types/models/gift';

import { useGuestSession } from '@/guest/GuestSessionContext';
import { GuestGiftCard } from '../components/GuestGiftCard';
import { cartItemCount } from '../utils';

type SortOption = 'original' | 'price-asc' | 'price-desc' | 'name';

export function BuyGiftsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { guestId } = useGuestSession();

  const { data: list, isLoading, isRefetching, refetch } = useGiftListBySlug(slug);
  const { data: cart } = useGetCart(guestId || undefined);
  const addToCart = useAddGiftToCart(guestId || undefined);
  const updateQuantity = useUpdateCartItemQuantity();
  const removeFromCart = useRemoveGiftFromCart();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('original');
  const [onlyMostWanted, setOnlyMostWanted] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);

  const gifts = useMemo<Gift[]>(() => {
    let result = [...(list?.gifts ?? [])];
    if (!showPurchased) result = result.filter((g) => !g.isPurchased);
    if (onlyMostWanted) result = result.filter((g) => g.isMostWanted);
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (g) => g.title.toLowerCase().includes(term) || g.description?.toLowerCase().includes(term),
      );
    }
    switch (sortBy) {
      case 'price-asc':
        return result.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return result.sort((a, b) => b.price - a.price);
      case 'name':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return result.sort((a, b) => a.order - b.order);
    }
  }, [list?.gifts, showPurchased, onlyMostWanted, search, sortBy]);

  const count = cartItemCount(cart?.items);

  const handleAdd = (giftId: number) => {
    if (!guestId) return;
    addToCart.mutate({ giftId, quantity: 1, sessionId: guestId });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Mesa</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/registry/${slug}/cart`)}
          hitSlop={8}
          className="flex-row items-center rounded-full bg-oak px-4 py-1.5 active:bg-oakDark"
        >
          <Text className="text-sm font-semibold text-white">Carrito{count > 0 ? ` · ${count}` : ''}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4704a" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
        >
          <Text className="text-2xl font-bold text-ink">Regalos</Text>
          <Text className="mt-0.5 text-sm text-mutedForeground">{list?.coupleName}</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar regalos…"
            placeholderTextColor="#949ca4"
            className="mt-3 rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerClassName="gap-2">
            <Chip label="Más deseados" active={onlyMostWanted} onPress={() => setOnlyMostWanted((v) => !v)} />
            <Chip label="Mostrar regalados" active={showPurchased} onPress={() => setShowPurchased((v) => !v)} />
            <Chip
              label={sortBy === 'price-asc' ? 'Precio ↑' : sortBy === 'price-desc' ? 'Precio ↓' : sortBy === 'name' ? 'Nombre' : 'Orden'}
              active={sortBy !== 'original'}
              onPress={() =>
                setSortBy((s) => (s === 'original' ? 'price-asc' : s === 'price-asc' ? 'price-desc' : s === 'price-desc' ? 'name' : 'original'))
              }
            />
          </ScrollView>

          <View className="mt-4">
            {gifts.length > 0 ? (
              gifts.map((gift) => (
                <GuestGiftCard
                  key={gift.id}
                  gift={gift}
                  cartItems={cart?.items ?? []}
                  onAddToCart={handleAdd}
                  onUpdateQuantity={(cartItemId, quantity) => updateQuantity.mutate({ cartItemId, quantity })}
                  onRemove={(cartItemId) => removeFromCart.mutate(cartItemId)}
                  onPress={() => router.push(`/registry/${slug}/cart`)}
                />
              ))
            ) : (
              <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
                <Text className="text-base font-semibold text-ink">No se encontraron regalos</Text>
                <Text className="mt-1 text-center text-sm text-mutedForeground">Ajusta la búsqueda o los filtros.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-1.5 ${active ? 'border-oak bg-oak' : 'border-gray-300 bg-white'}`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}
