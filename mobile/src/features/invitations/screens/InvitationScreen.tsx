import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCurrentUser } from 'hooks/useUser';
import { useInvitationByGiftList, usePublishInvitation } from 'hooks/useInvitation';

import { useToast } from '@/lib/ToastProvider';
import { WEB_URL } from '@/lib/apiConfig';
import { formatEventDate } from '@/lib/format';

const STATUS_META = {
  PUBLISHED: { label: 'Publicada', chip: 'bg-success/15', text: 'text-success' },
  DRAFT: { label: 'Borrador', chip: 'bg-gray-200', text: 'text-gray-600' },
  ARCHIVED: { label: 'Archivada', chip: 'bg-gray-200', text: 'text-gray-600' },
} as const;

export function InvitationScreen({ listId }: { listId: number }) {
  const router = useRouter();
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { data: invitation, isLoading, isError } = useInvitationByGiftList(listId);
  const publish = usePublishInvitation();

  const slug = invitation?.slug || user?.slug || '';
  const publicUrl = slug ? `${WEB_URL}/${slug}/${listId}/invitacion` : '';

  const onShare = async () => {
    if (!publicUrl) return;
    try {
      await Share.share({ message: publicUrl, url: publicUrl });
    } catch {
      /* user dismissed */
    }
  };

  const onOpen = () => {
    if (publicUrl) Linking.openURL(publicUrl);
  };

  const onPublish = async () => {
    if (!invitation) return;
    try {
      await publish.mutateAsync({ id: invitation.id, slug });
      toast.success('Invitación publicada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo publicar');
    }
  };

  const meta = invitation ? STATUS_META[invitation.status] : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Atrás</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        <Text className="mb-4 text-2xl font-bold text-ink">Invitación</Text>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : isError || !invitation ? (
          <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
            <Text className="text-base font-semibold text-ink">Aún no has creado tu invitación</Text>
            <Text className="mt-1 text-center text-sm text-mutedForeground">
              El diseñador de invitaciones está disponible en la versión web. Una vez creada, podrás publicarla y
              compartirla desde aquí.
            </Text>
          </View>
        ) : (
          <View>
            <View className="rounded-ml border border-gray-200 bg-white p-5">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-lg font-semibold text-ink" numberOfLines={1}>
                  {invitation.eventName}
                </Text>
                {meta ? (
                  <View className={`ml-2 rounded-full px-2.5 py-0.5 ${meta.chip}`}>
                    <Text className={`text-xs font-medium ${meta.text}`}>{meta.label}</Text>
                  </View>
                ) : null}
              </View>
              {invitation.publishedAt ? (
                <Text className="mt-1 text-sm text-mutedForeground">Publicada el {formatEventDate(invitation.publishedAt)}</Text>
              ) : null}
              <Text className="mt-2 text-sm text-gray-500">{invitation.viewCount ?? 0} visitas</Text>
              {publicUrl ? <Text className="mt-3 text-xs text-oak">{publicUrl}</Text> : null}
            </View>

            {invitation.status !== 'PUBLISHED' ? (
              <Pressable
                className="mt-5 items-center rounded-ml bg-oak py-3 active:bg-oakDark"
                disabled={publish.isPending}
                onPress={onPublish}
              >
                {publish.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Publicar invitación</Text>
                )}
              </Pressable>
            ) : null}

            <View className="mt-3 flex-row gap-3">
              <Pressable className="flex-1 items-center rounded-ml border border-gray-200 py-3 active:bg-gray-100" onPress={onOpen}>
                <Text className="text-base font-semibold text-ink">Abrir</Text>
              </Pressable>
              <Pressable className="flex-1 items-center rounded-ml border border-gray-200 py-3 active:bg-gray-100" onPress={onShare}>
                <Text className="text-base font-semibold text-ink">Compartir</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
