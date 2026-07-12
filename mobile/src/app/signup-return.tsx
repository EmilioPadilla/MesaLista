import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Fallback landing for the fixed-plan signup deep link. In the normal flow
 * `WebBrowser.openAuthSessionAsync` intercepts the redirect and resolves in
 * SignupScreen, so this only renders if the link cold-opens the app; we just
 * bounce to the entry screen (which forwards signed-in users into the app).
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
