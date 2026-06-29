import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Invitee, RsvpCustomFieldResponse } from 'services/rsvp.service';

type Status = Invitee['status'];

const STATUS_META: Record<Status, { label: string; chip: string; text: string }> = {
  CONFIRMED: { label: 'Confirmado', chip: 'bg-success/15', text: 'text-success' },
  REJECTED: { label: 'Rechazado', chip: 'bg-danger/15', text: 'text-danger' },
  PENDING: { label: 'Pendiente', chip: 'bg-gray-200', text: 'text-gray-600' },
};

function formatResponseValue(value: string, type: RsvpCustomFieldResponse['field']['type']): string {
  if (type === 'BOOLEAN') return value === 'true' ? 'Sí' : 'No';
  return value;
}

interface InviteeDetailModalProps {
  visible: boolean;
  invitee: Invitee | null;
  responses: RsvpCustomFieldResponse[];
  onClose: () => void;
  onSetStatus: (invitee: Invitee, status: Status) => void;
  onDelete: (invitee: Invitee) => void;
}

/**
 * Read view for a single invitee: status, tickets, the message they left when
 * responding, and their answers to any custom RSVP questions.
 */
export function InviteeDetailModal({ visible, invitee, responses, onClose, onSetStatus, onDelete }: InviteeDetailModalProps) {
  if (!invitee) return null;

  const name = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ') || 'Invitado';
  const meta = STATUS_META[invitee.status];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-3">
          <Pressable onPress={onClose} hitSlop={8}>
            <Text className="text-base text-mutedForeground">Cerrar</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">Invitado</Text>
          <View className="w-12" />
        </View>

        <ScrollView contentContainerClassName="px-5 py-5">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-2xl font-bold text-ink">{name}</Text>
            <View className={`ml-2 rounded-full px-2.5 py-0.5 ${meta.chip}`}>
              <Text className={`text-xs font-medium ${meta.text}`}>{meta.label}</Text>
            </View>
          </View>

          <Text className="mt-1 text-sm text-mutedForeground">
            {invitee.tickets} {invitee.tickets === 1 ? 'boleto' : 'boletos'}
            {invitee.status === 'CONFIRMED' && invitee.confirmedTickets != null
              ? ` · ${invitee.confirmedTickets} confirmados`
              : ''}
          </Text>
          <Text className="mt-2 text-xs text-gray-500">Código: {invitee.secretCode}</Text>

          {invitee.guestMessage ? (
            <View className="mt-5">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Mensaje del invitado</Text>
              <View className="rounded-ml border border-gray-200 bg-white p-4">
                <Text className="text-base leading-6 text-ink">{invitee.guestMessage}</Text>
              </View>
            </View>
          ) : null}

          {responses.length > 0 ? (
            <View className="mt-5">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Respuestas</Text>
              <View className="rounded-ml border border-gray-200 bg-white">
                {responses.map((r, i) => (
                  <View key={r.id} className={`p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <Text className="text-sm font-medium text-mutedForeground">{r.field.label}</Text>
                    <Text className="mt-0.5 text-base text-ink">{formatResponseValue(r.value, r.field.type)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-6 flex-row gap-2">
            <Pressable
              onPress={() => onSetStatus(invitee, 'CONFIRMED')}
              className={`flex-1 items-center rounded-ml border py-3 ${
                invitee.status === 'CONFIRMED' ? 'border-success bg-success' : 'border-gray-300 bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${invitee.status === 'CONFIRMED' ? 'text-white' : 'text-gray-700'}`}>
                Confirmar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSetStatus(invitee, 'REJECTED')}
              className={`flex-1 items-center rounded-ml border py-3 ${
                invitee.status === 'REJECTED' ? 'border-danger bg-danger' : 'border-gray-300 bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${invitee.status === 'REJECTED' ? 'text-white' : 'text-gray-700'}`}>
                Rechazar
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => onDelete(invitee)}
            className="mt-3 items-center rounded-ml border border-danger/40 py-3 active:bg-danger/5"
          >
            <Text className="text-sm font-semibold text-danger">Eliminar invitado</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
