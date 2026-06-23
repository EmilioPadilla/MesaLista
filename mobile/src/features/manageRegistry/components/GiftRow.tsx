import { Image, Pressable, Text, View } from 'react-native';
import type { Gift } from 'types/models/gift';

import { formatCurrency } from '@/lib/format';

interface GiftRowProps {
  gift: Gift;
  onEdit: (gift: Gift) => void;
  onDelete: (gift: Gift) => void;
}

export function GiftRow({ gift, onEdit, onDelete }: GiftRowProps) {
  return (
    <Pressable
      onPress={() => onEdit(gift)}
      className="mb-3 flex-row items-center gap-3 rounded-ml border border-gray-200 bg-white p-3 active:opacity-80"
    >
      {gift.imageUrl ? (
        <Image source={{ uri: gift.imageUrl }} className="h-14 w-14 rounded-lg bg-gray-100" />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <Text className="text-lg">🎁</Text>
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
            {gift.title}
          </Text>
          {gift.isMostWanted ? (
            <View className="rounded-full bg-oak/15 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-oak">Más deseado</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-sm text-mutedForeground">{formatCurrency(gift.price)}</Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          {gift.isPurchased ? (
            <Text className="text-xs font-medium text-success">Comprado</Text>
          ) : (
            <Text className="text-xs text-gray-500">Disponible</Text>
          )}
          {gift.quantity > 1 ? <Text className="text-xs text-gray-500">· x{gift.quantity}</Text> : null}
        </View>
      </View>

      <Pressable onPress={() => onDelete(gift)} hitSlop={10} className="px-2 py-1">
        <Text className="text-sm font-medium text-danger">Eliminar</Text>
      </Pressable>
    </Pressable>
  );
}
