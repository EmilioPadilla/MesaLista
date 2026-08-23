import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Fallback landing for the legacy fixed-plan signup deep link.
 *
 * Signup no longer takes payment, so nothing in this build redirects here — the
 * plan payment returns via `payment-return` instead. The route stays mounted
 * because a Stripe session started on an older App Store build can still land on
 * it after the couple updates the app. Bounce to the entry screen, which
 * forwards signed-in users into the app.
 */
export default function SignupReturnRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#d4704a" size="large" />
    </View>
  );
}
