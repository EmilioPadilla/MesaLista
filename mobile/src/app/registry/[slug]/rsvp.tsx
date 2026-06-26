import { useLocalSearchParams } from 'expo-router';

import { GuestRsvpScreen } from '@/features/guestRsvp';

export default function GuestRsvpRoute() {
  const { slug, code } = useLocalSearchParams<{ slug: string; code?: string }>();
  if (!slug) return null;
  return <GuestRsvpScreen slug={slug} initialCode={code} />;
}
