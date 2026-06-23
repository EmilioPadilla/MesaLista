import { Pressable, Text, View } from 'react-native';
import type { GiftListWithGifts } from 'types/models/giftList';

import { formatCurrency, formatEventDate, getRaisedAmount } from '../utils';

interface GiftListCardProps {
  list: GiftListWithGifts;
  onPress?: (list: GiftListWithGifts) => void;
}

export function GiftListCard({ list, onPress }: GiftListCardProps) {
  const total = list.gifts?.length ?? 0;
  const purchased = list.gifts?.filter((g) => g.isPurchased).length ?? 0;
  const raised = getRaisedAmount(list);

  return (
    <Pressable
      onPress={() => onPress?.(list)}
      className="mb-4 overflow-hidden rounded-ml border border-gray-200 bg-white active:opacity-80"
    >
      <View className="px-5 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-lg font-semibold text-ink" numberOfLines={1}>
            {list.title || list.coupleName}
          </Text>
          <View className={`ml-3 rounded-full px-2.5 py-0.5 ${list.isActive ? 'bg-success/15' : 'bg-gray-200'}`}>
            <Text className={`text-xs font-medium ${list.isActive ? 'text-success' : 'text-gray-600'}`}>
              {list.isActive ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>

        <Text className="mt-0.5 text-sm text-mutedForeground">{list.coupleName}</Text>
        {list.eventDate ? <Text className="mt-1 text-xs text-gray-500">{formatEventDate(list.eventDate)}</Text> : null}

        <View className="mt-4 flex-row gap-6">
          <Stat label="Regalos" value={String(total)} />
          <Stat label="Comprados" value={String(purchased)} />
          <Stat label="Recaudado" value={formatCurrency(raised)} />
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-base font-semibold text-ink">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
