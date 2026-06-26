import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Fallback landing for the payment deep link. In the normal flow
 * `WebBrowser.openAuthSessionAsync` intercepts the redirect and resolves in
 * CheckoutScreen, so this only renders if the link cold-opens the app; we just
 * bounce to Explore.
 */
export default function PaymentReturnRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/explore');
  }, [router]);
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#d4704a" size="large" />
    </View>
  );
}
