import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { usePushRegistration } from '@/hooks/usePushRegistration';

/**
 * Protected route group. Anything under (app)/ requires an authenticated user.
 */
export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  // Register this device for push once authenticated; deep-link on tap.
  usePushRegistration();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#d4704a" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fefdfb' } }} />;
}
