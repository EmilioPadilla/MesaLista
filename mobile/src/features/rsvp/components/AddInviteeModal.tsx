import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface InviteeFormValues {
  firstName: string;
  lastName: string;
  tickets: number;
}

interface AddInviteeModalProps {
  visible: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: InviteeFormValues) => void;
}

export function AddInviteeModal({ visible, submitting, onCancel, onSubmit }: AddInviteeModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tickets, setTickets] = useState('1');

  useEffect(() => {
    if (visible) {
      setFirstName('');
      setLastName('');
      setTickets('1');
    }
  }, [visible]);

  const canSubmit = firstName.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-3">
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text className="text-base text-mutedForeground">Cancelar</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">Nuevo invitado</Text>
          <Pressable
            onPress={() => canSubmit && onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), tickets: Math.max(1, Number(tickets) || 1) })}
            disabled={!canSubmit || submitting}
            hitSlop={8}
          >
            {submitting ? (
              <ActivityIndicator color="#d4704a" />
            ) : (
              <Text className={`text-base font-semibold ${canSubmit ? 'text-oak' : 'text-gray-400'}`}>Guardar</Text>
            )}
          </Pressable>
        </View>

        <View className="px-5 py-5">
          <Text className="mb-1 text-sm font-medium text-foreground">Nombre</Text>
          <TextInput
            className="mb-4 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="Nombre"
            placeholderTextColor="#949ca4"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Text className="mb-1 text-sm font-medium text-foreground">Apellido</Text>
          <TextInput
            className="mb-4 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="Opcional"
            placeholderTextColor="#949ca4"
            value={lastName}
            onChangeText={setLastName}
          />
          <Text className="mb-1 text-sm font-medium text-foreground">Boletos</Text>
          <TextInput
            className="w-28 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="1"
            placeholderTextColor="#949ca4"
            keyboardType="number-pad"
            value={tickets}
            onChangeText={setTickets}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
