import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useRsvpCustomFields,
  useCreateRsvpCustomField,
  useUpdateRsvpCustomField,
  useDeleteRsvpCustomField,
} from 'hooks/useRsvp';
import type { RsvpCustomField, RsvpCustomFieldType } from 'services/rsvp.service';

import { useToast } from '@/lib/ToastProvider';

const TYPE_OPTIONS: { value: RsvpCustomFieldType; label: string }[] = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'BOOLEAN', label: 'Sí / No' },
];

const TYPE_LABELS: Record<RsvpCustomFieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Sí / No',
};

interface CustomFieldsModalProps {
  visible: boolean;
  giftListId: number;
  onClose: () => void;
}

/**
 * Manage the per-list custom RSVP questions guests answer when they confirm
 * (mirrors the web CustomFieldsManager): add, rename, toggle required, delete.
 */
export function CustomFieldsModal({ visible, giftListId, onClose }: CustomFieldsModalProps) {
  const toast = useToast();
  const { data: fields = [], isLoading } = useRsvpCustomFields(giftListId, visible && !!giftListId);
  const createField = useCreateRsvpCustomField();
  const updateField = useUpdateRsvpCustomField();
  const deleteField = useDeleteRsvpCustomField();

  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<RsvpCustomFieldType>('TEXT');
  const [newRequired, setNewRequired] = useState(false);

  const resetForm = () => {
    setNewLabel('');
    setNewType('TEXT');
    setNewRequired(false);
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.warning('El nombre del campo es requerido');
      return;
    }
    try {
      await createField.mutateAsync({
        giftListId,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
        order: fields.length,
      });
      resetForm();
      toast.success('Campo agregado');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo agregar el campo');
    }
  };

  const handleToggleRequired = async (field: RsvpCustomField, required: boolean) => {
    try {
      await updateField.mutateAsync({ id: field.id, giftListId, data: { required } });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const handleDelete = (field: RsvpCustomField) => {
    Alert.alert(
      '¿Eliminar campo?',
      `Se eliminará "${field.label}" y todas las respuestas de tus invitados a este campo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteField.mutateAsync({ id: field.id, giftListId });
              toast.success('Campo eliminado');
            } catch (err: any) {
              toast.error(err?.response?.data?.error || 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-3">
          <Pressable onPress={onClose} hitSlop={8}>
            <Text className="text-base text-mutedForeground">Cerrar</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">Campos personalizados</Text>
          <View className="w-12" />
        </View>

        <ScrollView contentContainerClassName="px-5 py-5" keyboardShouldPersistTaps="handled">
          <Text className="mb-4 text-sm text-mutedForeground">
            Preguntas que tus invitados responden al confirmar su asistencia (ej. restricciones alimentarias).
          </Text>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#d4704a" />
            </View>
          ) : fields.length === 0 ? (
            <View className="mb-5 items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-8">
              <Text className="text-sm text-mutedForeground">Sin campos personalizados aún</Text>
            </View>
          ) : (
            fields.map((field) => (
              <View key={field.id} className="mb-3 rounded-ml border border-gray-200 bg-white p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
                    {field.label}
                  </Text>
                  <View className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5">
                    <Text className="text-xs font-medium text-gray-600">{TYPE_LABELS[field.type]}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Switch
                      value={field.required}
                      onValueChange={(v) => handleToggleRequired(field, v)}
                      trackColor={{ true: '#d4704a' }}
                    />
                    <Text className="text-sm text-mutedForeground">Requerido</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(field)} hitSlop={8} className="px-2 py-1">
                    <Text className="text-sm font-medium text-danger">Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <View className="mt-2 rounded-ml border border-oak/30 bg-white p-4">
            <Text className="mb-2 text-sm font-semibold text-ink">Nuevo campo</Text>
            <TextInput
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Ej: ¿Tiene restricciones alimentarias?"
              placeholderTextColor="#949ca4"
              className="mb-3 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            />
            <View className="mb-3 flex-row gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setNewType(opt.value)}
                  className={`rounded-full border px-3 py-1.5 ${
                    newType === opt.value ? 'border-oak bg-oak/10' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${newType === opt.value ? 'text-oak' : 'text-gray-600'}`}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mb-3 flex-row items-center gap-2">
              <Switch value={newRequired} onValueChange={setNewRequired} trackColor={{ true: '#d4704a' }} />
              <Text className="text-sm text-mutedForeground">Respuesta requerida</Text>
            </View>
            <Pressable
              onPress={handleAdd}
              disabled={createField.isPending}
              className="items-center rounded-ml bg-oak py-3 active:bg-oakDark"
            >
              {createField.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Agregar campo</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
