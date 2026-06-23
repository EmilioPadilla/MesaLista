import { useLocalSearchParams } from 'expo-router';

import { ManageRsvpScreen } from '@/features/rsvp';

export default function RsvpRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Number(listId);
  if (!Number.isFinite(id)) return null;
  return <ManageRsvpScreen listId={id} />;
}
