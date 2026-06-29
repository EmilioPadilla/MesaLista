import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  useInvitees,
  useRsvpStats,
  useCreateInvitee,
  useUpdateInvitee,
  useDeleteInvitee,
  useBulkDeleteInvitees,
  useBulkUpdateInviteeStatus,
  useRsvpCustomFieldResponses,
} from 'hooks/useRsvp';
import type { Invitee, RsvpCustomFieldResponse } from 'services/rsvp.service';

import { useToast } from '@/lib/ToastProvider';
import { InviteeRow } from '../components/InviteeRow';
import { AddInviteeModal, type InviteeFormValues } from '../components/AddInviteeModal';
import { CustomFieldsModal } from '../components/CustomFieldsModal';
import { InviteeDetailModal } from '../components/InviteeDetailModal';

export function ManageRsvpScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();
  const invitees = useInvitees(listId);
  const stats = useRsvpStats(listId);
  const responses = useRsvpCustomFieldResponses(listId);
  const createInvitee = useCreateInvitee();
  const updateInvitee = useUpdateInvitee();
  const deleteInvitee = useDeleteInvitee();
  const bulkDelete = useBulkDeleteInvitees();
  const bulkUpdateStatus = useBulkUpdateInviteeStatus();

  const [addVisible, setAddVisible] = useState(false);
  const [fieldsVisible, setFieldsVisible] = useState(false);
  const [detail, setDetail] = useState<Invitee | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const responsesByInvitee = useMemo(() => {
    const map: Record<string, RsvpCustomFieldResponse[]> = {};
    for (const r of responses.data ?? []) {
      (map[r.inviteeId] ??= []).push(r);
    }
    return map;
  }, [responses.data]);

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
            setDetail(null);
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const toggleSelect = (invitee: Invitee) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(invitee.id)) next.delete(invitee.id);
      else next.add(invitee.id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const onBulkStatus = async (status: Invitee['status']) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids, giftListId: listId, status });
      toast.success('Invitados actualizados');
      exitSelection();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const onBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    Alert.alert('¿Eliminar invitados?', `Se eliminarán ${ids.length} invitados seleccionados.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await bulkDelete.mutateAsync({ ids, giftListId: listId });
            toast.success('Invitados eliminados');
            exitSelection();
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const s = stats.data;
  const list = invitees.data ?? [];
  const selectedCount = selectedIds.size;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        {selectionMode ? (
          <>
            <Pressable onPress={exitSelection} hitSlop={8}>
              <Text className="text-base text-mutedForeground">Cancelar</Text>
            </Pressable>
            <Text className="text-base font-semibold text-ink">{selectedCount} seleccionados</Text>
            <View className="w-16" />
          </>
        ) : (
          <>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-base text-oak">‹ Atrás</Text>
            </Pressable>
            <Pressable onPress={() => setAddVisible(true)} hitSlop={8} className="rounded-full bg-oak px-4 py-1.5 active:bg-oakDark">
              <Text className="text-sm font-semibold text-white">+ Invitado</Text>
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-28"
        refreshControl={
          <RefreshControl
            refreshing={invitees.isRefetching || stats.isRefetching}
            onRefresh={() => {
              invitees.refetch();
              stats.refetch();
            }}
            tintColor="#d4704a"
          />
        }
      >
        <Text className="text-2xl font-bold text-ink">Confirmaciones</Text>

        <View className="mb-4 mt-3 flex-row gap-3">
          <StatTile label="Confirmados" value={s ? `${s.confirmed}` : '—'} tone="success" />
          <StatTile label="Pendientes" value={s ? `${s.pending}` : '—'} tone="muted" />
          <StatTile label="Boletos" value={s ? `${s.confirmedTickets}/${s.totalTickets}` : '—'} tone="ink" />
        </View>

        {!selectionMode && list.length > 0 ? (
          <View className="mb-4 flex-row gap-2">
            <SecondaryAction label="Campos personalizados" onPress={() => setFieldsVisible(true)} />
            <SecondaryAction label="Seleccionar" onPress={() => setSelectionMode(true)} />
          </View>
        ) : !selectionMode ? (
          <View className="mb-4">
            <SecondaryAction label="Campos personalizados" onPress={() => setFieldsVisible(true)} />
          </View>
        ) : null}

        {invitees.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : list.length > 0 ? (
          list.map((inv) => (
            <InviteeRow
              key={inv.id}
              invitee={inv}
              onSetStatus={onSetStatus}
              onDelete={onDelete}
              onPress={setDetail}
              selectable={selectionMode}
              selected={selectedIds.has(inv.id)}
              onToggleSelect={toggleSelect}
            />
          ))
        ) : (
          <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
            <Text className="text-base font-semibold text-ink">Sin invitados aún</Text>
            <Text className="mt-1 text-center text-sm text-mutedForeground">
              Agrega invitados para llevar el control de tus confirmaciones.
            </Text>
          </View>
        )}
      </ScrollView>

      {selectionMode ? (
        <View className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-gray-200 bg-white px-5 pb-8 pt-3">
          <BulkButton label="Confirmar" disabled={selectedCount === 0 || bulkUpdateStatus.isPending} onPress={() => onBulkStatus('CONFIRMED')} />
          <BulkButton label="Rechazar" disabled={selectedCount === 0 || bulkUpdateStatus.isPending} onPress={() => onBulkStatus('REJECTED')} />
          <BulkButton label="Eliminar" tone="danger" disabled={selectedCount === 0 || bulkDelete.isPending} onPress={onBulkDelete} />
        </View>
      ) : null}

      <AddInviteeModal visible={addVisible} submitting={createInvitee.isPending} onCancel={() => setAddVisible(false)} onSubmit={onAdd} />
      <CustomFieldsModal visible={fieldsVisible} giftListId={listId} onClose={() => setFieldsVisible(false)} />
      <InviteeDetailModal
        visible={detail !== null}
        invitee={detail}
        responses={detail ? responsesByInvitee[detail.id] ?? [] : []}
        onClose={() => setDetail(null)}
        onSetStatus={onSetStatus}
        onDelete={onDelete}
      />
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

function SecondaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-full border border-gray-300 bg-white px-4 py-1.5 active:bg-gray-100">
      <Text className="text-sm font-medium text-ink">{label}</Text>
    </Pressable>
  );
}

function BulkButton({
  label,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  tone?: 'danger';
  disabled?: boolean;
  onPress: () => void;
}) {
  const base = tone === 'danger' ? 'border-danger/40' : 'border-gray-300';
  const text = tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center rounded-ml border py-3 ${base} ${disabled ? 'opacity-40' : 'active:bg-gray-100'}`}
    >
      <Text className={`text-sm font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}
