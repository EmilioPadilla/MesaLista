import { useLocalSearchParams } from 'expo-router';

import { BuyGiftsScreen } from '@/features/guestRegistry';

export default function GiftsRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) return null;
  return <BuyGiftsScreen slug={slug} />;
}
