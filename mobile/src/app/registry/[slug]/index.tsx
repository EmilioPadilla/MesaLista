import { useLocalSearchParams } from 'expo-router';

import { PublicRegistryScreen } from '@/features/guestRegistry';

export default function RegistryRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) return null;
  return <PublicRegistryScreen slug={slug} />;
}
