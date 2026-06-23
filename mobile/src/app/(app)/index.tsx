import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthContext';

export default function DashboardHome() {
  const { user, logout } = useAuth();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 py-8">
        <Text className="text-sm text-mutedForeground">Hola,</Text>
        <Text className="mb-8 text-3xl font-bold text-ink">{displayName}</Text>

        <View className="rounded-ml border border-gray-200 bg-white p-5">
          <Text className="text-lg font-semibold text-ink">Tu mesa de regalos</Text>
          <Text className="mt-1 text-sm text-mutedForeground">
            Aquí gestionarás tus listas, invitaciones y confirmaciones (próximamente).
          </Text>
        </View>

        <Pressable className="mt-8 items-center rounded-ml border border-gray-200 py-4 active:bg-gray-100" onPress={logout}>
          <Text className="text-base font-semibold text-danger">Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
