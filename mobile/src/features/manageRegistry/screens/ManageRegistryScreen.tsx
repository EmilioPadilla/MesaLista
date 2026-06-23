import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useGiftListById } from 'hooks/useGiftList';
import { useCreateGift, useUpdateGift, useDeleteGift } from 'hooks/useGift';
import type { Gift } from 'types/models/gift';

import { useToast } from '@/lib/ToastProvider';
import { formatCurrency } from '@/lib/format';
import { GiftRow } from '../components/GiftRow';
import { GiftFormModal, type GiftFormValues } from '../components/GiftFormModal';

export function ManageRegistryScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();
  const { data: list, isLoading, isRefetching, refetch } = useGiftListById(listId);
  const createGift = useCreateGift();
  const updateGift = useUpdateGift();
  const deleteGift = useDeleteGift();

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);

  const gifts = useMemo(() => [...(list?.gifts ?? [])].sort((a, b) => a.order - b.order), [list?.gifts]);
  const purchased = gifts.filter((g) => g.isPurchased).length;
  const raised = gifts.filter((g) => g.isPurchased).reduce((s, g) => s + g.price, 0);

  const openCreate = () => {
    setEditing(null);
    setFormVisible(true);
  };
  const openEdit = (gift: Gift) => {
    setEditing(gift);
    setFormVisible(true);
  };

  const onSubmit = async (values: GiftFormValues) => {
    try {
      if (editing) {
        await updateGift.mutateAsync({ id: editing.id, data: values });
        toast.success('Regalo actualizado');
      } else {
        await createGift.mutateAsync({ ...values, giftListId: listId, isPurchased: false } as any);
        toast.success('Regalo agregado');
      }
      setFormVisible(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar el regalo');
    }
  };

  const onDelete = (gift: Gift) => {
    Alert.alert('¿Eliminar regalo?', `Se eliminará "${gift.title}". Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGift.mutateAsync(gift.id);
            toast.success('Regalo eliminado');
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Listas</Text>
        </Pressable>
        <Pressable onPress={openCreate} hitSlop={8} className="rounded-full bg-oak px-4 py-1.5 active:bg-oakDark">
          <Text className="text-sm font-semibold text-white">+ Regalo</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4704a" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
        >
          <Text className="text-2xl font-bold text-ink">{list?.title || list?.coupleName}</Text>
          <Text className="mb-4 mt-1 text-sm text-mutedForeground">
            {gifts.length} regalos · {purchased} comprados · {formatCurrency(raised)} recaudado
          </Text>

          {gifts.length > 0 ? (
            gifts.map((gift) => <GiftRow key={gift.id} gift={gift} onEdit={openEdit} onDelete={onDelete} />)
          ) : (
            <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
              <Text className="text-base font-semibold text-ink">Esta lista no tiene regalos</Text>
              <Text className="mt-1 text-center text-sm text-mutedForeground">
                Agrega tu primer regalo con el botón “+ Regalo”.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <GiftFormModal
        visible={formVisible}
        gift={editing}
        submitting={createGift.isPending || updateGift.isPending}
        onCancel={() => {
          setFormVisible(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
      />
    </SafeAreaView>
  );
}
