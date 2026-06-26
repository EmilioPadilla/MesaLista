import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import { useCurrentUser } from 'hooks/useUser';

import { AdminHeader } from '../components/AdminHeader';

type AdminEntry = {
  title: string;
  description: string;
  href?: Href;
};

// Mirrors the web admin surface (src/features/admin/*). Analytics ships first;
// the remaining areas are placeholders until their mobile phases land.
const ADMIN_ENTRIES: AdminEntry[] = [
  {
    title: 'Analíticas',
    description: 'Embudo de conversión, usuarios, listas y pagos.',
    href: '/(admin)/analytics',
  },
  { title: 'Control', description: 'Usuarios y mesas de regalos.' },
  { title: 'Códigos de descuento', description: 'Altas, edición y estadísticas.' },
  { title: 'Listas prediseñadas', description: 'Catálogo de mesas plantilla.' },
];

export function AdminHomeScreen() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader
        title="Panel admin"
        subtitle={`Hola, ${user?.firstName || 'admin'}`}
        showBack
        onBack={() => router.replace('/(app)')}
      />

      <ScrollView contentContainerClassName="px-6 pb-10 pt-2">
        <View className="gap-3">
          {ADMIN_ENTRIES.map((entry) => {
            const enabled = Boolean(entry.href);
            return (
              <Pressable
                key={entry.title}
                disabled={!enabled}
                onPress={() => entry.href && router.push(entry.href)}
                className={`rounded-ml border px-4 py-4 ${
                  enabled ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-muted'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`text-base font-semibold ${enabled ? 'text-ink' : 'text-gray-500'}`}>
                    {entry.title}
                  </Text>
                  {enabled ? (
                    <Text className="text-base text-oak">→</Text>
                  ) : (
                    <Text className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      Pronto
                    </Text>
                  )}
                </View>
                <Text className="mt-1 text-sm text-mutedForeground">{entry.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
