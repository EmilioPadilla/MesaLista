import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useInvitees, useRsvpStats, useCreateInvitee, useUpdateInvitee, useDeleteInvitee } from 'hooks/useRsvp';
import type { Invitee } from 'services/rsvp.service';

import { useToast } from '@/lib/ToastProvider';
import { InviteeRow } from '../components/InviteeRow';
import { AddInviteeModal, type InviteeFormValues } from '../components/AddInviteeModal';

export function ManageRsvpScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();
  const invitees = useInvitees(listId);
  const stats = useRsvpStats(listId);
  const createInvitee = useCreateInvitee();
  const updateInvitee = useUpdateInvitee();
  const deleteInvitee = useDeleteInvitee();
  const [addVisible, setAddVisible] = useState(false);

  const onAdd = async (values: InviteeFormValues) => {
    try {
      await createInvitee.mutateAsync({ giftListId: listId, ...values });
      toast.success('Invitado agregado');
      setAddVisible(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo agregar el invitado');
    }
  };

  const onSetStatus = async (invitee: Invitee, status: Invitee['status']) => {
    try {
      await updateInvitee.mutateAsync({ id: invitee.id, giftListId: listId, data: { status } });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const onDelete = (invitee: Invitee) => {
    const name = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ') || 'este invitado';
    Alert.alert('¿Eliminar invitado?', `Se eliminará a ${name}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInvitee.mutateAsync({ id: invitee.id, giftListId: listId });
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const s = stats.data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Atrás</Text>
        </Pressable>
        <Pressable onPress={() => setAddVisible(true)} hitSlop={8} className="rounded-full bg-oak px-4 py-1.5 active:bg-oakDark">
          <Text className="text-sm font-semibold text-white">+ Invitado</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10"
        refreshControl={
          <RefreshControl refreshing={invitees.isRefetching || stats.isRefetching} onRefresh={() => { invitees.refetch(); stats.refetch(); }} tintColor="#d4704a" />
        }
      >
        <Text className="text-2xl font-bold text-ink">Confirmaciones</Text>

        <View className="mb-5 mt-3 flex-row gap-3">
          <StatTile label="Confirmados" value={s ? `${s.confirmed}` : '—'} tone="success" />
          <StatTile label="Pendientes" value={s ? `${s.pending}` : '—'} tone="muted" />
          <StatTile label="Boletos" value={s ? `${s.confirmedTickets}/${s.totalTickets}` : '—'} tone="ink" />
        </View>

        {invitees.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : invitees.data && invitees.data.length > 0 ? (
          invitees.data.map((inv) => <InviteeRow key={inv.id} invitee={inv} onSetStatus={onSetStatus} onDelete={onDelete} />)
        ) : (
          <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
            <Text className="text-base font-semibold text-ink">Sin invitados aún</Text>
            <Text className="mt-1 text-center text-sm text-mutedForeground">Agrega invitados para llevar el control de tus confirmaciones.</Text>
          </View>
        )}
      </ScrollView>

      <AddInviteeModal visible={addVisible} submitting={createInvitee.isPending} onCancel={() => setAddVisible(false)} onSubmit={onAdd} />
    </SafeAreaView>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone: 'success' | 'muted' | 'ink' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'muted' ? 'text-gray-600' : 'text-ink';
  return (
    <View className="flex-1 rounded-ml border border-gray-200 bg-white px-3 py-3">
      <Text className={`text-lg font-bold ${color}`} numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
