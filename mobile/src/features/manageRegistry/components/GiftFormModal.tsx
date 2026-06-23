import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Gift } from 'types/models/gift';

export interface GiftFormValues {
  title: string;
  description: string;
  price: number;
  quantity: number;
  isMostWanted: boolean;
}

interface GiftFormModalProps {
  visible: boolean;
  /** When set, the form edits this gift; otherwise it creates a new one. */
  gift?: Gift | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: GiftFormValues) => void;
}

export function GiftFormModal({ visible, gift, submitting, onCancel, onSubmit }: GiftFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isMostWanted, setIsMostWanted] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(gift?.title ?? '');
      setDescription(gift?.description ?? '');
      setPrice(gift?.price != null ? String(gift.price) : '');
      setQuantity(gift?.quantity != null ? String(gift.quantity) : '1');
      setIsMostWanted(gift?.isMostWanted ?? false);
    }
  }, [visible, gift]);

  const canSubmit = title.trim().length > 0 && Number(price) > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      quantity: Math.max(1, Number(quantity) || 1),
      isMostWanted,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-3">
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text className="text-base text-mutedForeground">Cancelar</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">{gift ? 'Editar regalo' : 'Nuevo regalo'}</Text>
          <Pressable onPress={submit} disabled={!canSubmit || submitting} hitSlop={8}>
            {submitting ? (
              <ActivityIndicator color="#d4704a" />
            ) : (
              <Text className={`text-base font-semibold ${canSubmit ? 'text-oak' : 'text-gray-400'}`}>Guardar</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="px-5 py-5" keyboardShouldPersistTaps="handled">
          <Field label="Nombre del regalo">
            <TextInput
              className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
              placeholder="Ej. Juego de sartenes"
              placeholderTextColor="#949ca4"
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Descripción">
            <TextInput
              className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
              placeholder="Opcional"
              placeholderTextColor="#949ca4"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
          </Field>

          <View className="flex-row gap-3">
            <Field label="Precio (MXN)" className="flex-1">
              <TextInput
                className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                placeholder="0"
                placeholderTextColor="#949ca4"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </Field>
            <Field label="Cantidad" className="w-28">
              <TextInput
                className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                placeholder="1"
                placeholderTextColor="#949ca4"
                keyboardType="number-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            </Field>
          </View>

          <View className="mt-2 flex-row items-center justify-between rounded-ml border border-gray-200 bg-white px-4 py-3">
            <Text className="text-base text-ink">Más deseado</Text>
            <Switch value={isMostWanted} onValueChange={setIsMostWanted} trackColor={{ true: '#d4704a' }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <View className={`mb-4 ${className ?? ''}`}>
      <Text className="mb-1 text-sm font-medium text-foreground">{label}</Text>
      {children}
    </View>
  );
}
