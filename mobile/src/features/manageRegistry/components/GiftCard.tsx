import { Image, Pressable, Text, View } from 'react-native';
import type { Gift } from 'types/models/gift';

import { isFullyFunded, isGroupGift } from 'utils/giftFunding';

import { formatCurrency } from '@/lib/format';
import { FundingMeter } from '@/features/guestRegistry/components/FundingMeter';

interface GiftCardProps {
  gift: Gift;
  onEdit: (gift: Gift) => void;
  onDelete: (gift: Gift) => void;
}

/**
 * Square gift tile used in the 2-column manage-registry grid: a large image on
 * top with the title, price and status below.
 */
export function GiftCard({ gift, onEdit, onDelete }: GiftCardProps) {
  const isGroup = isGroupGift(gift);
  const isComplete = gift.isPurchased || (isGroup && isFullyFunded(gift));

  return (
    <Pressable
      onPress={() => onEdit(gift)}
      className="mb-4 w-[48%] overflow-hidden rounded-ml border border-gray-200 bg-white active:opacity-80"
    >
      <View className="relative" style={{ aspectRatio: 1 }}>
        {gift.imageUrl ? (
          <Image source={{ uri: gift.imageUrl }} className="h-full w-full bg-gray-100" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-muted">
            <Text className="text-4xl">🎁</Text>
          </View>
        )}
        {gift.isMostWanted ? (
          <View className="absolute left-2 top-2 rounded-full bg-oak px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-white">Más deseado</Text>
          </View>
        ) : null}
      </View>

      <View className="p-3">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {gift.title}
        </Text>
        <Text className="mt-0.5 text-sm text-mutedForeground">{formatCurrency(gift.price)}</Text>

        {/* The couple sees the same meter their guests do, so progress on a
            shared gift is legible without opening it. */}
        {isGroup ? (
          <View className="mt-2">
            <FundingMeter gift={gift} compact />
          </View>
        ) : null}

        <View className="mt-1 flex-row items-center justify-between">
          {isComplete ? (
            <Text className="text-xs font-medium text-success">{isGroup ? 'Completo' : 'Comprado'}</Text>
          ) : (
            <Text className="text-xs text-gray-500">Disponible</Text>
          )}
          <Pressable onPress={() => onDelete(gift)} hitSlop={10}>
            <Text className="text-xs font-medium text-danger">Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
