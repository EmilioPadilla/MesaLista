import { useLocalSearchParams } from 'expo-router';

import { PublishScreen } from '@/features/publish';

export default function PublishListRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Number(listId);
  if (!Number.isFinite(id)) return null;
  return <PublishScreen listId={id} />;
}
