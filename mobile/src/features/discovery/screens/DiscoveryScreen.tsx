import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGiftLists } from 'hooks/useGiftList';
import type { GiftListBrief } from 'types/models/giftList';

import { useAuth } from '@/auth/AuthContext';
import { RegistryCard } from '../components/RegistryCard';

export function DiscoveryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isRefetching, refetch } = useGiftLists() as {
    data: GiftListBrief[] | undefined;
    isLoading: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };
  const [search, setSearch] = useState('');

  const registries = useMemo(() => {
    const all = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (r) => r.coupleName.toLowerCase().includes(term) || r.userSlug.toLowerCase().includes(term),
    );
  }, [data, search]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-1 pt-3">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace(isAuthenticated ? '/(app)' : '/login'))}
          hitSlop={8}
        >
          <Text className="text-base text-oak">‹ {isAuthenticated ? 'Mis listas' : 'Entrar'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
      >
        <Text className="mt-1 text-2xl font-bold text-ink">Explorar mesas</Text>
        <Text className="mt-0.5 text-sm text-mutedForeground">
          Encuentra la mesa de regalos de tus seres queridos.
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por pareja o código…"
          placeholderTextColor="#949ca4"
          autoCapitalize="none"
          className="mt-4 rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
        />

        <Text className="mb-3 mt-3 text-xs text-mutedForeground">
          {registries.length} mesa(s) encontrada(s)
        </Text>

        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#d4704a" size="large" />
          </View>
        ) : registries.length > 0 ? (
          registries.map((registry) => (
            <RegistryCard
              key={registry.id}
              registry={registry}
              onPress={() => router.push(`/registry/${registry.userSlug}`)}
            />
          ))
        ) : (
          <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
            <Text className="text-base font-semibold text-ink">No se encontraron mesas</Text>
            <Text className="mt-1 text-center text-sm text-mutedForeground">Intenta con otro nombre o código.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
