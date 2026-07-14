import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { GiftListWithGifts } from 'types/models/giftList';

import { formatCurrency, formatEventCountdown, getListProgress } from '../utils';
import { ProgressBar } from './ProgressBar';

interface GiftListCardProps {
  list: GiftListWithGifts;
  onPress?: (list: GiftListWithGifts) => void;
}

const cardShadow = {
  shadowColor: '#101418',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

export function GiftListCard({ list, onPress }: GiftListCardProps) {
  const { raised, total, purchased, ratio } = getListProgress(list);
  const percent = Math.round(ratio * 100);
  const countdown = formatEventCountdown(list.eventDate);

  return (
    <Pressable
      onPress={() => onPress?.(list)}
      className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white active:opacity-90"
      style={cardShadow}
    >
      {list.imageUrl ? (
        <Image source={{ uri: list.imageUrl }} contentFit="cover" transition={200} style={{ width: '100%', height: 120 }} />
      ) : null}

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

        <Text className="mt-0.5 text-sm text-mutedForeground" numberOfLines={1}>
          {list.coupleName}
          {countdown ? <Text className="text-mutedForeground">  ·  {countdown}</Text> : null}
        </Text>

        <View className="mt-4">
          <ProgressBar ratio={ratio} height={8} />
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-gray-600">
              {purchased} de {total} regalos · {percent}%
            </Text>
            <Text className="text-sm font-semibold text-oak">{formatCurrency(raised)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
