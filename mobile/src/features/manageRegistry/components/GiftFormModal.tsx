import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { Gift } from 'types/models/gift';

import { useToast } from '@/lib/ToastProvider';
import { uploadImageAsync } from '@/lib/uploadImage';

export interface GiftFormValues {
  title: string;
  description: string;
  price: number;
  quantity: number;
  isMostWanted: boolean;
  imageUrl: string;
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
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isMostWanted, setIsMostWanted] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(gift?.title ?? '');
      setDescription(gift?.description ?? '');
      setPrice(gift?.price != null ? String(gift.price) : '');
      setQuantity(gift?.quantity != null ? String(gift.quantity) : '1');
      setIsMostWanted(gift?.isMostWanted ?? false);
      setImageUrl(gift?.imageUrl ?? '');
      setUploading(false);
    }
  }, [visible, gift]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.warning('Necesitamos acceso a tus fotos para cambiar la imagen');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri);
      setImageUrl(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = title.trim().length > 0 && Number(price) > 0 && !uploading;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      quantity: Math.max(1, Number(quantity) || 1),
      isMostWanted,
      imageUrl,
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
          <Field label="Imagen">
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              className="items-center justify-center overflow-hidden rounded-ml border border-gray-200 bg-white active:opacity-80"
              style={{ aspectRatio: 1 }}
            >
              {uploading ? (
                <ActivityIndicator color="#d4704a" />
              ) : imageUrl ? (
                <>
                  <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
                  <View className="absolute bottom-0 left-0 right-0 items-center bg-black/40 py-2">
                    <Text className="text-sm font-semibold text-white">Cambiar imagen</Text>
                  </View>
                </>
              ) : (
                <View className="items-center">
                  <Text className="text-3xl">🖼️</Text>
                  <Text className="mt-1 text-sm font-medium text-oak">Agregar imagen</Text>
                </View>
              )}
            </Pressable>
          </Field>

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
