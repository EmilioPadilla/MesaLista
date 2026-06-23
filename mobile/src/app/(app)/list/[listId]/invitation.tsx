import { useLocalSearchParams } from 'expo-router';

import { InvitationScreen } from '@/features/invitations';

export default function InvitationRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Number(listId);
  if (!Number.isFinite(id)) return null;
  return <InvitationScreen listId={id} />;
}
