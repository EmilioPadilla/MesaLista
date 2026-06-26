import { useLocalSearchParams } from 'expo-router';

import { CartScreen } from '@/features/guestRegistry';

export default function CartRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) return null;
  return <CartScreen slug={slug} />;
}
