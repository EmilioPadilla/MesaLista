import { Pressable, Text, View } from 'react-native';
import type { Invitee } from 'services/rsvp.service';

type Status = Invitee['status'];

const STATUS_META: Record<Status, { label: string; chip: string; text: string }> = {
  CONFIRMED: { label: 'Confirmado', chip: 'bg-success/15', text: 'text-success' },
  REJECTED: { label: 'Rechazado', chip: 'bg-danger/15', text: 'text-danger' },
  PENDING: { label: 'Pendiente', chip: 'bg-gray-200', text: 'text-gray-600' },
};

interface InviteeRowProps {
  invitee: Invitee;
  onSetStatus: (invitee: Invitee, status: Status) => void;
  onDelete: (invitee: Invitee) => void;
  onPress: (invitee: Invitee) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (invitee: Invitee) => void;
}

export function InviteeRow({ invitee, onSetStatus, onDelete, onPress, selectable, selected, onToggleSelect }: InviteeRowProps) {
  const meta = STATUS_META[invitee.status];
  const name = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ') || 'Invitado';

  if (selectable) {
    return (
      <Pressable
        onPress={() => onToggleSelect?.(invitee)}
        className={`mb-3 flex-row items-center gap-3 rounded-ml border p-3 ${
          selected ? 'border-oak bg-oak/5' : 'border-gray-200 bg-white'
        }`}
      >
        <View
          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? 'border-oak bg-oak' : 'border-gray-300'
          }`}
        >
          {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
        </View>
        <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
          {name}
        </Text>
        <View className={`rounded-full px-2.5 py-0.5 ${meta.chip}`}>
          <Text className={`text-xs font-medium ${meta.text}`}>{meta.label}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => onPress(invitee)} className="mb-3 rounded-ml border border-gray-200 bg-white p-3 active:bg-gray-50">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
          {name}
        </Text>
        <View className={`ml-2 rounded-full px-2.5 py-0.5 ${meta.chip}`}>
          <Text className={`text-xs font-medium ${meta.text}`}>{meta.label}</Text>
        </View>
      </View>

      <Text className="mt-0.5 text-sm text-mutedForeground">
        {invitee.tickets} {invitee.tickets === 1 ? 'boleto' : 'boletos'}
        {invitee.status === 'CONFIRMED' && invitee.confirmedTickets != null ? ` · ${invitee.confirmedTickets} confirmados` : ''}
      </Text>
      {invitee.guestMessage ? <Text className="mt-1 text-sm italic text-gray-500" numberOfLines={1}>“{invitee.guestMessage}”</Text> : null}

      <View className="mt-3 flex-row items-center gap-2">
        {invitee.status === 'PENDING' ? (
          <>
            <QuickAction label="Confirmar" tone="success" onPress={() => onSetStatus(invitee, 'CONFIRMED')} />
            <QuickAction label="Rechazar" tone="danger" onPress={() => onSetStatus(invitee, 'REJECTED')} />
          </>
        ) : (
          <Text className="text-xs text-gray-400">Toca para cambiar su respuesta</Text>
        )}
        <View className="flex-1" />
        <Pressable onPress={() => onDelete(invitee)} hitSlop={8} className="px-2 py-1">
          <Text className="text-sm font-medium text-danger">Eliminar</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function QuickAction({ label, tone, onPress }: { label: string; tone: 'success' | 'danger'; onPress: () => void }) {
  const cls = tone === 'success' ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10';
  const textCls = tone === 'success' ? 'text-success' : 'text-danger';
  const icon = tone === 'success' ? '✓' : '✕';
  return (
    <Pressable onPress={onPress} className={`flex-row items-center gap-1 rounded-full border px-3.5 py-1.5 active:opacity-70 ${cls}`}>
      <Text className={`text-xs font-bold ${textCls}`}>{icon}</Text>
      <Text className={`text-xs font-semibold ${textCls}`}>{label}</Text>
    </Pressable>
  );
}
