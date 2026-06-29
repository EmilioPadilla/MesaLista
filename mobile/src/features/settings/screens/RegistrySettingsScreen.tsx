import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useCurrentUser, useUpdateCurrentUserProfile, useCheckSlugAvailability } from 'hooks/useUser';
import { useGiftListById, useUpdateGiftList } from 'hooks/useGiftList';
import { useRsvpMessages, useUpdateRsvpMessages } from 'hooks/useRsvp';
import { useDebounce } from 'hooks/useDebounce';

import { useToast } from '@/lib/ToastProvider';
import { uploadImageAsync } from '@/lib/uploadImage';

/**
 * Per–gift-list settings, mirroring the web Settings page's registry sections
 * (cover image, public link, event info, privacy, fee preference, RSVP and
 * thank-you messages). Account-level settings live in {@link SettingsScreen}.
 */
export function RegistrySettingsScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();

  const { data: user } = useCurrentUser();
  const { data: list, isLoading, isRefetching, refetch } = useGiftListById(listId);
  const { data: messages } = useRsvpMessages(listId, !!listId);

  const updateProfile = useUpdateCurrentUserProfile();
  const updateGiftList = useUpdateGiftList();
  const updateMessages = useUpdateRsvpMessages();

  // Cover image (auto-saves on upload, like web).
  const [uploadingImage, setUploadingImage] = useState(false);

  // Public link / slug.
  const [slug, setSlug] = useState('');
  const debouncedSlug = useDebounce(slug, 500);
  const slugChanged = slug.length > 0 && slug !== user?.slug;
  const { data: slugCheck, isFetching: isCheckingSlug } = useCheckSlugAvailability(
    slugChanged ? debouncedSlug : undefined,
    user?.id,
  );

  // Event info.
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');

  // Privacy + fee.
  const [isPublic, setIsPublic] = useState(true);
  const [feePreference, setFeePreference] = useState<'couple' | 'guest'>('couple');

  // Messages.
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');

  useEffect(() => {
    if (!list) return;
    setSlug(user?.slug ?? '');
    setVenue(list.eventVenue ?? '');
    setLocation(list.eventLocation ?? '');
    setEventDate(list.eventDate ? String(list.eventDate).slice(0, 10) : '');
    setDescription(list.description ?? '');
    setIsPublic(list.isPublic ?? true);
    setFeePreference((list.feePreference as 'couple' | 'guest') || 'couple');
    setThankYouMessage(list.thankYouMessage ?? '');
  }, [list, user?.slug]);

  useEffect(() => {
    if (messages) {
      setConfirmationMessage(messages.confirmationMessage ?? '');
      setCancellationMessage(messages.cancellationMessage ?? '');
    }
  }, [messages]);

  const hasReceivedGifts = useMemo(() => (list?.gifts ?? []).some((g) => g.isPurchased), [list?.gifts]);

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.warning('Necesitamos acceso a tus fotos para cambiar la portada');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [21, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageAsync(result.assets[0].uri);
      await updateGiftList.mutateAsync({ id: listId, data: { imageUrl } });
      toast.success('Imagen de portada actualizada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveSlug = async () => {
    if (!slugChanged) return;
    if (slugCheck && !slugCheck.available) {
      toast.warning('Este enlace ya está en uso. Elige otro.');
      return;
    }
    try {
      await updateProfile.mutateAsync({ slug });
      toast.success('Enlace actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo actualizar el enlace');
    }
  };

  const saveInfo = async () => {
    let isoDate: string | undefined;
    if (eventDate) {
      const parsed = new Date(eventDate);
      if (Number.isNaN(parsed.getTime())) {
        toast.warning('La fecha debe tener el formato AAAA-MM-DD');
        return;
      }
      isoDate = parsed.toISOString();
    }
    try {
      await updateGiftList.mutateAsync({
        id: listId,
        data: {
          eventVenue: venue,
          eventLocation: location,
          eventDate: isoDate,
          description,
        },
      });
      toast.success('Información actualizada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar la información');
    }
  };

  const savePrivacy = async () => {
    try {
      await updateGiftList.mutateAsync({ id: listId, data: { isPublic } });
      toast.success('Privacidad actualizada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar');
    }
  };

  const saveFee = async () => {
    try {
      await updateGiftList.mutateAsync({ id: listId, data: { feePreference } });
      toast.success('Configuración de comisiones actualizada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar');
    }
  };

  const saveMessages = async () => {
    try {
      await updateMessages.mutateAsync({ giftListId: listId, confirmationMessage, cancellationMessage });
      toast.success('Mensajes de confirmación actualizados');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar');
    }
  };

  const saveThankYou = async () => {
    try {
      await updateGiftList.mutateAsync({ id: listId, data: { thankYouMessage: thankYouMessage.trim() || null } });
      toast.success('Mensaje de agradecimiento actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo guardar');
    }
  };

  // Dirty flags drive the per-section save buttons.
  const infoDirty =
    venue !== (list?.eventVenue ?? '') ||
    location !== (list?.eventLocation ?? '') ||
    eventDate !== (list?.eventDate ? String(list.eventDate).slice(0, 10) : '') ||
    description !== (list?.description ?? '');
  const privacyDirty = isPublic !== (list?.isPublic ?? true);
  const feeDirty = feePreference !== ((list?.feePreference as 'couple' | 'guest') || 'couple');
  const messagesDirty =
    confirmationMessage !== (messages?.confirmationMessage ?? '') ||
    cancellationMessage !== (messages?.cancellationMessage ?? '');
  const thankYouDirty = thankYouMessage !== (list?.thankYouMessage ?? '');

  const coverUrl = list?.imageUrl ?? '';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Atrás</Text>
        </Pressable>
        <Text className="text-base font-semibold text-ink">Ajustes de la lista</Text>
        <View className="w-12" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4704a" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-12"
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
        >
          <Section title="Portada">
            <Pressable
              onPress={pickCover}
              disabled={uploadingImage}
              className="items-center justify-center overflow-hidden rounded-ml border border-gray-200 bg-muted active:opacity-80"
              style={{ aspectRatio: 21 / 9 }}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#d4704a" />
              ) : coverUrl ? (
                <>
                  <Image source={{ uri: coverUrl }} className="h-full w-full" resizeMode="cover" />
                  <View className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-2">
                    <Text className="text-sm font-semibold text-oak">Cambiar</Text>
                  </View>
                </>
              ) : (
                <View className="items-center">
                  <Text className="text-3xl">🖼️</Text>
                  <Text className="mt-1 text-sm font-medium text-oak">Agregar portada</Text>
                </View>
              )}
            </Pressable>
            <Text className="mt-2 text-xs text-mutedForeground">
              Recomendado: 1920 × 820 píxeles · Se guarda automáticamente al subirla.
            </Text>
          </Section>

          <Section title="Enlace público">
            <View className="flex-row items-center rounded-ml border border-gray-200 bg-white">
              <Text className="pl-3 text-sm text-mutedForeground">mesalista.com.mx/</Text>
              <TextInput
                value={slug}
                onChangeText={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="tu-enlace"
                placeholderTextColor="#949ca4"
                autoCapitalize="none"
                className="flex-1 py-3 pr-3 text-base text-ink"
              />
            </View>
            <Text className="mt-1 text-xs text-mutedForeground">Solo letras minúsculas, números y guiones.</Text>
            {slugChanged && isCheckingSlug ? (
              <Text className="mt-1 text-xs text-mutedForeground">Verificando disponibilidad…</Text>
            ) : slugChanged && slugCheck?.available ? (
              <Text className="mt-1 text-xs font-medium text-success">✓ Este enlace está disponible</Text>
            ) : slugChanged && slugCheck && !slugCheck.available ? (
              <Text className="mt-1 text-xs font-medium text-danger">Este enlace ya está en uso.</Text>
            ) : null}
            {slugChanged ? (
              <Text className="mt-2 text-xs text-mutedForeground">
                Al cambiar tu enlace, la URL anterior dejará de funcionar. Comparte la nueva con tus invitados.
              </Text>
            ) : null}
            <PrimaryButton
              label="Guardar enlace"
              loading={updateProfile.isPending}
              disabled={!slugChanged || (slugCheck != null && !slugCheck.available)}
              onPress={saveSlug}
            />
          </Section>

          <Section title="Información del evento">
            <Labeled label="Lugar del evento">
              <Input value={venue} onChangeText={setVenue} placeholder="Ej: Hacienda San José" />
            </Labeled>
            <Labeled label="Ciudad, Estado">
              <Input value={location} onChangeText={setLocation} placeholder="Ej: Guadalajara, Jalisco" />
            </Labeled>
            <Labeled label="Fecha del evento">
              <Input value={eventDate} onChangeText={setEventDate} placeholder="AAAA-MM-DD" autoCapitalize="none" />
            </Labeled>
            <Labeled label="Mensaje a tus invitados">
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Comparte tu historia o un mensaje para tus invitados…"
                multiline
                numberOfLines={4}
                maxLength={500}
                className="h-28 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                style={{ textAlignVertical: 'top' }}
              />
            </Labeled>
            <PrimaryButton
              label="Guardar información"
              loading={updateGiftList.isPending}
              disabled={!infoDirty}
              onPress={saveInfo}
            />
          </Section>

          <Section title="Privacidad">
            <RadioOption
              selected={isPublic}
              title="Pública"
              description="Aparece en la búsqueda. Cualquiera puede encontrarla buscando tu nombre."
              onPress={() => setIsPublic(true)}
            />
            <RadioOption
              selected={!isPublic}
              title="Privada"
              description="No aparece en búsquedas. Solo quienes tengan tu enlace podrán acceder."
              onPress={() => setIsPublic(false)}
            />
            <PrimaryButton label="Guardar privacidad" loading={updateGiftList.isPending} disabled={!privacyDirty} onPress={savePrivacy} />
          </Section>

          <Section title="Comisiones">
            <RadioOption
              selected={feePreference === 'couple'}
              disabled={hasReceivedGifts}
              title="Nosotros absorbemos las comisiones"
              description="Tus invitados pagan el monto exacto; las comisiones se deducen de lo que recibes."
              onPress={() => setFeePreference('couple')}
            />
            <RadioOption
              selected={feePreference === 'guest'}
              disabled={hasReceivedGifts}
              title="Los invitados pagan las comisiones"
              description="Las comisiones se añaden al total que pagan tus invitados; recibes el monto completo."
              onPress={() => setFeePreference('guest')}
            />
            {hasReceivedGifts ? (
              <View className="mt-1 rounded-ml border border-amber-200 bg-amber-50 p-3">
                <Text className="text-sm font-semibold text-amber-900">Configuración bloqueada</Text>
                <Text className="mt-1 text-sm text-amber-800">
                  Ya recibiste regalos, por lo que no puedes cambiar esta opción. Escríbenos a info@mesalista.com.mx.
                </Text>
              </View>
            ) : (
              <PrimaryButton label="Guardar comisiones" loading={updateGiftList.isPending} disabled={!feeDirty} onPress={saveFee} />
            )}
          </Section>

          <Section title="Mensajes de confirmación (RSVP)">
            <Labeled label="Mensaje de confirmación">
              <Input
                value={confirmationMessage}
                onChangeText={setConfirmationMessage}
                placeholder="¡Gracias por confirmar tu asistencia!"
                multiline
                maxLength={200}
                className="h-20 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                style={{ textAlignVertical: 'top' }}
              />
            </Labeled>
            <Labeled label="Mensaje de cancelación">
              <Input
                value={cancellationMessage}
                onChangeText={setCancellationMessage}
                placeholder="Lamentamos que no puedas asistir. ¡Gracias por avisarnos!"
                multiline
                maxLength={200}
                className="h-20 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                style={{ textAlignVertical: 'top' }}
              />
            </Labeled>
            <PrimaryButton label="Guardar mensajes" loading={updateMessages.isPending} disabled={!messagesDirty} onPress={saveMessages} />
          </Section>

          <Section title="Mensaje de agradecimiento">
            <Labeled label="Mensaje para quien te regala">
              <Input
                value={thankYouMessage}
                onChangeText={setThankYouMessage}
                placeholder="¡Gracias de corazón por tu regalo!"
                multiline
                maxLength={500}
                className="h-28 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                style={{ textAlignVertical: 'top' }}
              />
            </Labeled>
            <PrimaryButton label="Guardar mensaje" loading={updateGiftList.isPending} disabled={!thankYouDirty} onPress={saveThankYou} />
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</Text>
      <View className="rounded-ml border border-gray-200 bg-white p-4">{children}</View>
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-foreground">{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#949ca4"
      className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
      autoCapitalize="sentences"
      {...props}
    />
  );
}

function RadioOption({
  selected,
  title,
  description,
  onPress,
  disabled,
}: {
  selected: boolean;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`mb-3 flex-row gap-3 rounded-ml border p-3 ${
        selected ? 'border-oak/40 bg-oak/5' : 'border-gray-200'
      } ${disabled ? 'opacity-60' : 'active:opacity-80'}`}
    >
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-oak bg-oak' : 'border-gray-300'
        }`}
      >
        {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="mt-0.5 text-sm text-mutedForeground">{description}</Text>
      </View>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mt-1 items-center rounded-ml py-3 ${disabled ? 'bg-gray-300' : 'bg-oak active:bg-oakDark'}`}
      disabled={loading || disabled}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-semibold text-white">{label}</Text>}
    </Pressable>
  );
}
