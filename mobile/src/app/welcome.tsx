import { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { useScreenView } from '@/lib/analytics';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

/**
 * First screen for signed-out users: brand moment + the two ways in
 * (couples sign in, guests explore registries without an account).
 */
export default function WelcomeScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Top of the signup/login funnel: gives mobile sessions a `visitors` entry.
  useScreenView('/welcome');

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Soft warm atmosphere behind the content */}
      <View pointerEvents="none" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-oak/5" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-oak/10" />

      <View className="flex-1 items-center justify-center px-8">
        <FadeIn delay={0}>
          <View
            className="rounded-3xl"
            style={{
              shadowColor: '#101418',
              shadowOpacity: 0.25,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <Image
              source={require('../../assets/images/ios-icon.png')}
              className="h-24 w-24 rounded-3xl"
              accessibilityIgnoresInvertColors
            />
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Text className="mt-8 text-xs font-semibold uppercase tracking-[4px] text-oak">Bienvenidos</Text>
        </FadeIn>

        <FadeIn delay={200}>
          <Text className="mt-3 text-center text-5xl text-ink" style={{ fontFamily: serif }}>
            MesaLista
          </Text>
        </FadeIn>

        <FadeIn delay={280}>
          <View className="mt-5 flex-row items-center gap-3">
            <View className="h-px w-10 bg-oak/30" />
            <View className="h-1.5 w-1.5 rotate-45 bg-oak/60" />
            <View className="h-px w-10 bg-oak/30" />
          </View>
        </FadeIn>

        <FadeIn delay={360}>
          <Text className="mt-5 px-4 text-center text-base leading-6 text-mutedForeground">
            La mesa de regalos para celebrar su historia, y para quienes quieren acompañarla.
          </Text>
        </FadeIn>
      </View>

      <FadeIn delay={480}>
        <View className="px-8 pb-6">
          <Pressable
            className="items-center rounded-full bg-oak py-4 active:bg-oakDark"
            onPress={() => router.push('/login')}
          >
            <Text className="text-base font-semibold text-white">Iniciar sesión</Text>
          </Pressable>

          <Pressable
            className="mt-3 items-center rounded-full border border-oak/40 bg-white/60 py-4 active:bg-oak/5"
            onPress={() => router.push('/explore')}
          >
            <Text className="text-base font-semibold text-oak">Explorar mesas de regalos</Text>
          </Pressable>

          <Pressable className="mt-4 items-center py-1" onPress={() => router.push('/signup')} hitSlop={8}>
            <Text className="text-sm text-mutedForeground">
              ¿Aún no tienes cuenta? <Text className="font-semibold text-oak">Crear cuenta</Text>
            </Text>
          </Pressable>

          <Text className="mt-4 text-center text-xs text-mutedForeground">Pagos 100% seguros · Stripe & PayPal</Text>
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

/** Staggered mount reveal: fade + rise, driven by plain RN Animated. */
function FadeIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
