import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGiftListBySlug } from 'hooks/useGiftList';

import { RegistryHero } from '../components/RegistryHero';

export function PublicRegistryScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: list, isLoading, isRefetching, refetch, isError } = useGiftListBySlug(slug);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={8}>
          <Text className="text-base text-oak">‹ Explorar</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4704a" size="large" />
        </View>
      ) : isError || !list ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base font-semibold text-ink">No encontramos esta mesa de regalos</Text>
          <Text className="mt-1 text-center text-sm text-mutedForeground">
            Verifica el enlace o busca a la pareja en Explorar.
          </Text>
          <Pressable onPress={() => router.replace('/explore')} className="mt-5 rounded-full bg-oak px-5 py-2.5">
            <Text className="text-sm font-semibold text-white">Ir a Explorar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="pb-10"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
        >
          <RegistryHero list={list} />

          <View className="gap-3 px-5 pt-2">
            {list.isActive === false ? (
              <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-8">
                <Text className="text-base font-semibold text-ink">Esta mesa ya está cerrada</Text>
                <Text className="mt-1 text-center text-sm text-mutedForeground">
                  {list.coupleName} ya no está recibiendo regalos a través de esta mesa.
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push(`/registry/${slug}/gifts`)}
                className="items-center rounded-full bg-oak py-3.5 active:bg-oakDark"
              >
                <Text className="text-base font-semibold text-white">Ver regalos 🎁</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push(`/registry/${slug}/rsvp`)}
              className="items-center rounded-full border border-oak bg-white py-3.5 active:bg-oak/5"
            >
              <Text className="text-base font-semibold text-oak">Confirmar asistencia</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
