import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCurrentUser } from 'hooks/useUser';
import { useGiftListsByUser } from 'hooks/useGiftList';
import type { GiftListWithGifts } from 'types/models/giftList';

import { GiftListCard } from '../components/GiftListCard';
import { ProgressBar } from '../components/ProgressBar';
import { formatCurrency, getListProgress } from '../utils';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

const heroShadow = {
  shadowColor: '#c05f3d',
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
} as const;

export function MyGiftListsScreen() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: lists, isLoading, isRefetching, refetch } = useGiftListsByUser(user?.id);

  const stats = (lists ?? []).reduce(
    (acc: { raised: number; goal: number; gifts: number; purchased: number; invites: number; active: number }, l: GiftListWithGifts) => {
      const p = getListProgress(l);
      acc.raised += p.raised;
      acc.goal += p.goal;
      acc.gifts += p.total;
      acc.purchased += p.purchased;
      acc.invites += l.invitationCount ?? 0;
      if (l.isActive) acc.active += 1;
      return acc;
    },
    { raised: 0, goal: 0, gifts: 0, purchased: 0, invites: 0, active: 0 },
  );

  const overallRatio = stats.goal > 0 ? stats.raised / stats.goal : 0;
  const overallPercent = Math.round(overallRatio * 100);
  const hasLists = !!lists && lists.length > 0;

  const onOpenList = (list: GiftListWithGifts) => {
    router.push(`/list/${list.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Soft warm atmosphere behind the content */}
      <View pointerEvents="none" className="absolute -right-24 -top-16 h-64 w-64 rounded-full bg-oak/5" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-oak/[0.06]" />

      <View className="flex-row items-start justify-between px-6 pb-3 pt-4">
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[3px] text-oak">
            Hola{user?.firstName ? `, ${user.firstName}` : ''}
          </Text>
          <Text className="mt-1 text-3xl text-ink" style={{ fontFamily: serif }}>
            Mis listas
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Pressable
              onPress={() => router.push('/(admin)')}
              hitSlop={8}
              className="rounded-full border border-oak/30 bg-white/70 px-3 py-1.5 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-oak">Admin</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/70 active:opacity-70"
          >
            <Text className="text-base">⚙️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#d4704a" />}
      >
        {isLoading ? (
          <View className="items-center py-24">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : hasLists ? (
          <>
            <FadeIn delay={0}>
              <View className="mb-6 overflow-hidden rounded-2xl bg-oak" style={heroShadow}>
                <View pointerEvents="none" className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10" />
                <View pointerEvents="none" className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-black/5" />

                <View className="px-5 py-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/80">
                    Recaudado en total
                  </Text>
                  <Text className="mt-1 text-4xl text-white" style={{ fontFamily: serif }}>
                    {formatCurrency(stats.raised)}
                  </Text>

                  {stats.goal > 0 ? (
                    <>
                      <Text className="mt-1 text-sm text-white/85">
                        de {formatCurrency(stats.goal)} · {overallPercent}% completado
                      </Text>
                      <View className="mt-4">
                        <ProgressBar
                          ratio={overallRatio}
                          height={10}
                          fillColor="#fefdfb"
                          trackColor="rgba(255,255,255,0.22)"
                          delay={250}
                        />
                      </View>
                    </>
                  ) : (
                    <Text className="mt-2 text-sm text-white/85">
                      Agrega regalos a tus listas para empezar a recaudar 🎁
                    </Text>
                  )}

                  <View className="mt-5 flex-row">
                    <HeroStat value={`${stats.purchased}/${stats.gifts}`} label="Regalos" />
                    <HeroDivider />
                    <HeroStat value={String(stats.active)} label={stats.active === 1 ? 'Lista activa' : 'Listas activas'} />
                    {stats.invites > 0 ? (
                      <>
                        <HeroDivider />
                        <HeroStat value={String(stats.invites)} label="Invitados" />
                      </>
                    ) : null}
                  </View>
                </View>
              </View>
            </FadeIn>

            {lists.map((list: GiftListWithGifts, i: number) => (
              <FadeIn key={list.id} delay={120 + i * 80}>
                <GiftListCard list={list} onPress={onOpenList} />
              </FadeIn>
            ))}
          </>
        ) : (
          <FadeIn delay={0}>
            <View className="mt-6 items-center rounded-2xl border border-dashed border-oak/30 bg-white px-6 py-14">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-oak/10">
                <Text className="text-2xl">🎁</Text>
              </View>
              <Text className="mt-4 text-lg font-semibold text-ink">Aún no tienes listas</Text>
              <Text className="mt-1 text-center text-sm leading-relaxed text-mutedForeground">
                Crea tu primera mesa de regalos para empezar a recibir aportaciones de tus invitados.
              </Text>
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="text-lg font-bold text-white" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-white/70" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function HeroDivider() {
  return <View className="mx-3 w-px self-stretch bg-white/20" />;
}

/** Staggered mount reveal: fade + rise, driven by plain RN Animated. */
function FadeIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: 450, delay, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
