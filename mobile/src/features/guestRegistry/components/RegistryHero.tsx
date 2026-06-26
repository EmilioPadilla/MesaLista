import { ImageBackground, Text, View } from 'react-native';
import type { GiftListWithGifts } from 'types/models/giftList';

import { formatEventDate } from '@/lib/format';

/** Shared registry header used on the landing and gifts screens. */
export function RegistryHero({ list }: { list: GiftListWithGifts }) {
  const content = (
    <View className="items-center px-6 py-10">
      <View className="rounded-full border border-oak/30 bg-white/80 px-4 py-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-oak">Mesa de regalos</Text>
      </View>
      <Text className="mt-4 text-center text-3xl font-bold text-ink">{list.coupleName}</Text>
      {list.eventDate ? (
        <Text className="mt-1 text-base font-semibold text-foreground">{formatEventDate(list.eventDate)}</Text>
      ) : null}
      {list.eventLocation ? (
        <Text className="mt-1 text-sm text-mutedForeground">📍 {list.eventLocation}</Text>
      ) : null}
      {list.description ? (
        <Text className="mt-4 max-w-md text-center text-sm leading-relaxed text-foreground">{list.description}</Text>
      ) : null}
    </View>
  );

  if (list.imageUrl) {
    return (
      <ImageBackground source={{ uri: list.imageUrl }} resizeMode="cover" className="overflow-hidden">
        <View className="bg-background/80">{content}</View>
      </ImageBackground>
    );
  }

  return <View className="bg-muted">{content}</View>;
}
