import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Shared header for admin screens: optional back affordance, title, and an
 * optional subtitle. Back defaults to router.back() but can be overridden.
 */
export function AdminHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View className="px-6 pb-2 pt-4">
      {showBack ? (
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8} className="mb-1 self-start">
          <Text className="text-sm font-medium text-oak">← Atrás</Text>
        </Pressable>
      ) : null}
      <Text className="text-2xl font-bold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-sm text-mutedForeground">{subtitle}</Text> : null}
    </View>
  );
}
