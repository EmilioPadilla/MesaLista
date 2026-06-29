import { useLocalSearchParams } from 'expo-router';

import { RegistrySettingsScreen } from '@/features/settings';

export default function RegistrySettingsRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Number(listId);
  if (!Number.isFinite(id)) return null;
  return <RegistrySettingsScreen listId={id} />;
}
