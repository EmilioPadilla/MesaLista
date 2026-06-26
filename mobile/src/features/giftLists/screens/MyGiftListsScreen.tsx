import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCurrentUser } from 'hooks/useUser';
import { useGiftListsByUser } from 'hooks/useGiftList';
import type { GiftListWithGifts } from 'types/models/giftList';

import { GiftListCard } from '../components/GiftListCard';
import { formatCurrency, getRaisedAmount } from '../utils';

export function MyGiftListsScreen() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: lists, isLoading, isRefetching, refetch } = useGiftListsByUser(user?.id);

  const activeLists = lists?.filter((l) => l.isActive).length ?? 0;
  const totalGifts = lists?.reduce((sum, l) => sum + (l.gifts?.length ?? 0), 0) ?? 0;
  const totalRaised = lists?.reduce((sum, l) => sum + getRaisedAmount(l), 0) ?? 0;

  const onOpenList = (list: GiftListWithGifts) => {
    router.push(`/list/${list.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <View>
          <Text className="text-sm text-mutedForeground">Hola, {user?.firstName || ''}</Text>
          <Text className="text-2xl font-bold text-ink">Mis listas</Text>
        </View>
        <View className="flex-row items-center gap-4">
          {user?.role === 'ADMIN' && (
            <Pressable onPress={() => router.push('/(admin)')} hitSlop={8}>
              <Text className="text-sm font-medium text-oak">Admin</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Text className="text-sm font-medium text-oak">Ajustes</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
      >
        <View className="mb-5 flex-row gap-3">
          <SummaryTile label="Listas activas" value={String(activeLists)} />
          <SummaryTile label="Regalos" value={String(totalGifts)} />
          <SummaryTile label="Recaudado" value={formatCurrency(totalRaised)} />
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : lists && lists.length > 0 ? (
          lists.map((list) => <GiftListCard key={list.id} list={list} onPress={onOpenList} />)
        ) : (
          <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
            <Text className="text-base font-semibold text-ink">Aún no tienes listas</Text>
            <Text className="mt-1 text-center text-sm text-mutedForeground">
              Crea tu primera mesa de regalos para empezar a recibir aportaciones.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-ml border border-gray-200 bg-white px-3 py-3">
      <Text className="text-lg font-bold text-ink" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
