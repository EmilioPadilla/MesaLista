import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';

/**
 * Admin route group. Anything under (admin)/ requires an authenticated user
 * whose role is ADMIN — mirrors the web admin pages' `user.role !== 'ADMIN'`
 * guard. Non-admins are bounced to the app dashboard; logged-out users to login.
 */
export default function AdminLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#d4704a" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.role !== 'ADMIN') {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fefdfb' } }} />;
}
