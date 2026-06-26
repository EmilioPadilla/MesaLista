import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useInviteeByCode, useRespondToRsvp, useRsvpMessages, useRsvpCustomFields } from 'hooks/useRsvp';

import { useToast } from '@/lib/ToastProvider';

const normalize = (code: string) => code.trim().toUpperCase();

export function GuestRsvpScreen({ slug, initialCode }: { slug?: string; initialCode?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [searchCode, setSearchCode] = useState(initialCode ?? '');
  const [activeCode, setActiveCode] = useState(initialCode ? normalize(initialCode) : '');
  const [confirmedTickets, setConfirmedTickets] = useState(1);
  const [guestMessage, setGuestMessage] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: invitee, isLoading, isError, refetch } = useInviteeByCode(activeCode, !!activeCode);
  const { data: messages } = useRsvpMessages(invitee?.giftListId ?? 0, !!invitee);
  const { data: customFields = [] } = useRsvpCustomFields(invitee?.giftListId ?? 0, !!invitee);
  const respond = useRespondToRsvp();

  useEffect(() => {
    if (invitee) {
      setConfirmedTickets(invitee.confirmedTickets || invitee.tickets || 1);
      setCustomFieldValues({});
    }
  }, [invitee]);

  const handleSearch = () => {
    const code = normalize(searchCode);
    if (!code) {
      toast.error('Ingresa tu código secreto');
      return;
    }
    setSubmitted(false);
    setActiveCode(code);
    // If the code is unchanged, the query won't refire on its own.
    if (code === activeCode) refetch();
  };

  const handleRespond = async (confirm: boolean) => {
    if (!invitee) return;

    if (confirm) {
      const missing = customFields.filter(
        (f) => f.required && (customFieldValues[f.id] === undefined || customFieldValues[f.id] === ''),
      );
      if (missing.length > 0) {
        toast.error(`Responde los campos requeridos: ${missing.map((f) => f.label).join(', ')}`);
        return;
      }
    }

    const cfResponses = Object.entries(customFieldValues)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([fieldId, value]) => ({ fieldId: Number(fieldId), value }));

    try {
      await respond.mutateAsync({
        secretCode: invitee.secretCode,
        status: confirm ? 'CONFIRMED' : 'REJECTED',
        confirmedTickets: confirm ? confirmedTickets : 0,
        guestMessage: guestMessage.trim() || undefined,
        customFieldResponses: cfResponses.length > 0 ? cfResponses : undefined,
      });
      setSubmitted(true);
      toast.success(confirm ? 'Asistencia confirmada' : 'Respuesta registrada');
    } catch {
      toast.error('No se pudo registrar tu respuesta. Intenta de nuevo.');
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(slug ? `/registry/${slug}` : '/explore'));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={goBack} hitSlop={8}>
          <Text className="text-base text-oak">‹ Volver</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12" keyboardShouldPersistTaps="handled">
        {submitted && invitee ? (
          <View className="mt-6 items-center rounded-ml border border-gray-200 bg-white p-6">
            <Text className="text-4xl">{invitee.status === 'CONFIRMED' ? '✅' : '🧡'}</Text>
            <Text className="mt-3 text-xl font-bold text-ink">
              {invitee.status === 'CONFIRMED' ? '¡Confirmado!' : 'Respuesta registrada'}
            </Text>
            <Text className="mt-2 text-center text-sm text-mutedForeground">
              {invitee.status === 'CONFIRMED'
                ? messages?.confirmationMessage || '¡Gracias por confirmar! Nos encantará verte.'
                : messages?.cancellationMessage || 'Lamentamos que no puedas asistir. ¡Gracias por avisar!'}
            </Text>
            <Pressable onPress={goBack} className="mt-5 rounded-full bg-oak px-5 py-2.5">
              <Text className="text-sm font-semibold text-white">Listo</Text>
            </Pressable>
          </View>
        ) : invitee && invitee.status === 'PENDING' ? (
          <View className="mt-2">
            <Text className="text-2xl font-bold text-ink">¡Hola, {invitee.firstName}!</Text>
            <Text className="mt-1 text-sm text-mutedForeground">Por favor confirma tu asistencia.</Text>

            {invitee.tickets > 1 ? (
              <View className="mt-5">
                <Text className="mb-2 text-sm font-medium text-foreground">¿Cuántas personas asistirán?</Text>
                <View className="flex-row items-center justify-center gap-6 rounded-ml border border-gray-200 bg-white py-3">
                  <Pressable
                    onPress={() => setConfirmedTickets((n) => Math.max(1, n - 1))}
                    className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                  >
                    <Text className="text-xl font-bold text-oak">−</Text>
                  </Pressable>
                  <Text className="text-2xl font-bold text-ink">{confirmedTickets}</Text>
                  <Pressable
                    onPress={() => setConfirmedTickets((n) => Math.min(invitee.tickets, n + 1))}
                    className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                  >
                    <Text className="text-xl font-bold text-oak">+</Text>
                  </Pressable>
                </View>
                <Text className="mt-1 text-center text-xs text-gray-500">de {invitee.tickets} boletos</Text>
              </View>
            ) : null}

            {customFields.map((field) => (
              <View key={field.id} className="mt-4">
                <Text className="mb-1.5 text-sm font-medium text-foreground">
                  {field.label}
                  {field.required ? <Text className="text-danger"> *</Text> : null}
                </Text>
                {field.type === 'BOOLEAN' ? (
                  <Switch
                    value={customFieldValues[field.id] === 'true'}
                    onValueChange={(v) => setCustomFieldValues((p) => ({ ...p, [field.id]: v ? 'true' : 'false' }))}
                    trackColor={{ true: '#d4704a' }}
                  />
                ) : (
                  <TextInput
                    value={customFieldValues[field.id] ?? ''}
                    onChangeText={(t) => setCustomFieldValues((p) => ({ ...p, [field.id]: t }))}
                    keyboardType={field.type === 'NUMBER' ? 'number-pad' : 'default'}
                    placeholder="Tu respuesta…"
                    placeholderTextColor="#949ca4"
                    className="rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
                  />
                )}
              </View>
            ))}

            <View className="mt-4">
              <Text className="mb-1.5 text-sm font-medium text-foreground">Mensaje (opcional)</Text>
              <TextInput
                value={guestMessage}
                onChangeText={setGuestMessage}
                multiline
                numberOfLines={3}
                maxLength={500}
                placeholder="Escribe un mensaje…"
                placeholderTextColor="#949ca4"
                className="min-h-[80px] rounded-ml border border-gray-200 bg-white px-4 py-2.5 text-base text-ink"
                textAlignVertical="top"
              />
            </View>

            <Pressable
              disabled={respond.isPending}
              onPress={() => handleRespond(true)}
              className="mt-5 items-center rounded-full bg-success py-3.5 active:opacity-90"
            >
              <Text className="text-base font-semibold text-white">
                {respond.isPending ? 'Enviando…' : 'Confirmar asistencia'}
              </Text>
            </Pressable>
            <Pressable
              disabled={respond.isPending}
              onPress={() => handleRespond(false)}
              className="mt-3 items-center rounded-full border border-gray-300 bg-white py-3.5"
            >
              <Text className="text-base font-semibold text-foreground">No podré asistir</Text>
            </Pressable>
          </View>
        ) : invitee ? (
          <View className="mt-6 items-center rounded-ml border border-gray-200 bg-white p-6">
            <Text className="text-base font-semibold text-ink">Ya respondiste</Text>
            <Text className="mt-2 text-center text-sm text-mutedForeground">
              {invitee.status === 'CONFIRMED'
                ? `Confirmaste con ${invitee.confirmedTickets ?? invitee.tickets} boleto(s).`
                : 'Indicaste que no podrás asistir.'}
            </Text>
            <Text className="mt-3 text-center text-xs text-gray-500">
              Si necesitas cambiar tu respuesta, contacta a los novios.
            </Text>
            <Pressable onPress={() => setActiveCode('')} className="mt-4 rounded-full border border-oak px-5 py-2.5">
              <Text className="text-sm font-semibold text-oak">Buscar otra invitación</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-4">
            <Text className="text-2xl font-bold text-ink">Confirmación de asistencia</Text>
            <Text className="mt-1 text-sm text-mutedForeground">
              Ingresa el código secreto de tu invitación para confirmar.
            </Text>

            <View className="mt-5">
              <Text className="mb-1.5 text-sm font-medium text-foreground">Código secreto</Text>
              <TextInput
                value={searchCode}
                onChangeText={(t) => setSearchCode(t.toUpperCase())}
                onSubmitEditing={handleSearch}
                autoCapitalize="characters"
                placeholder="ABC12345"
                placeholderTextColor="#949ca4"
                maxLength={20}
                className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-center text-lg tracking-widest text-ink"
              />
            </View>

            {activeCode && isError ? (
              <Text className="mt-3 text-center text-sm text-danger">
                No encontramos una invitación con ese código.
              </Text>
            ) : null}

            <Pressable
              disabled={isLoading}
              onPress={handleSearch}
              className="mt-5 items-center rounded-full bg-oak py-3.5 active:bg-oakDark"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Buscar invitación</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
