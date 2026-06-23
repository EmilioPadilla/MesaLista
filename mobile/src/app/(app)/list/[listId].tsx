import { useLocalSearchParams } from 'expo-router';

import { ManageRegistryScreen } from '@/features/manageRegistry';

export default function ManageListRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Number(listId);
  if (!Number.isFinite(id)) return null;
  return <ManageRegistryScreen listId={id} />;
}
