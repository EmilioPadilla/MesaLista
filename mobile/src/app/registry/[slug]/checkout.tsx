import { useLocalSearchParams } from 'expo-router';

import { CheckoutScreen } from '@/features/guestRegistry';

export default function CheckoutRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) return null;
  return <CheckoutScreen slug={slug} />;
}
