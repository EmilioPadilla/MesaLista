import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';

/**
 * Fallback landing for the payment deep link. In the normal flow
 * `WebBrowser.openAuthSessionAsync` intercepts the redirect and resolves in the
 * screen that opened checkout (CheckoutScreen for guest gifts, PublishScreen for
 * the fixed plan), so this only renders if the link cold-opens the app.
 *
 * Where we bounce to depends on who is returning: a signed-in couple came back
 * from publishing their own registry and belongs in the app (the publish screen
 * re-reads the list and reflects whether the payment landed); an anonymous guest
 * was buying a gift and belongs in Explore.
 */
export default function PaymentReturnRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/(app)' : '/explore');
  }, [router, isAuthenticated, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#d4704a" size="large" />
    </View>
  );
}
