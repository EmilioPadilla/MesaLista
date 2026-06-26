import { Image, Pressable, Text, View } from 'react-native';
import type { GiftListBrief } from 'types/models/giftList';

import { formatEventDate } from '@/lib/format';

export function RegistryCard({ registry, onPress }: { registry: GiftListBrief; onPress: () => void }) {
  const closed = !registry.isActive;
  const progress = registry.totalGifts > 0 ? Math.round((registry.purchasedGifts / registry.totalGifts) * 100) : 0;

  return (
    <Pressable
      disabled={closed}
      onPress={onPress}
      className={`mb-4 overflow-hidden rounded-ml border border-gray-200 bg-white ${closed ? 'opacity-60' : 'active:opacity-90'}`}
    >
      <View className="relative">
        {registry.imageUrl ? (
          <Image source={{ uri: registry.imageUrl }} className="h-40 w-full bg-gray-100" resizeMode="cover" />
        ) : (
          <View className="h-40 w-full items-center justify-center bg-muted">
            <Text className="text-4xl">💍</Text>
          </View>
        )}
        <View className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1">
          <Text className="text-xs font-medium text-ink">{registry.userSlug}</Text>
        </View>
        {closed ? (
          <View className="absolute left-3 top-3 rounded-full bg-gray-800/90 px-2.5 py-1">
            <Text className="text-xs font-medium text-white">Cerrada</Text>
          </View>
        ) : null}
      </View>

      <View className="px-4 py-3">
        <Text className="text-lg font-semibold text-ink">{registry.coupleName}</Text>
        {registry.eventDate ? (
          <Text className="mt-0.5 text-xs text-gray-500">{formatEventDate(registry.eventDate)}</Text>
        ) : null}
        {registry.eventLocation ? (
          <Text className="mt-0.5 text-sm text-mutedForeground">📍 {registry.eventLocation}</Text>
        ) : null}

        <View className="mt-3">
          <View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <View className="h-2 rounded-full bg-oak" style={{ width: `${progress}%` }} />
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-gray-500">{registry.purchasedGifts} comprados</Text>
            <Text className="text-xs text-gray-500">{registry.totalGifts} total</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
