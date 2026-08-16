import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { trackEvent, useScreenView } from '@/lib/analytics';
import { useToast } from '@/lib/ToastProvider';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

export default function LoginScreen() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useScreenView('/login');

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  const onSubmit = async () => {
    if (!email || !password) {
      toast.warning('Ingresa tu correo y contraseña');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      // The /users/me query hasn't resolved yet, so take the id from the login
      // response rather than from the auth context.
      trackEvent('SIGN_IN', { method: 'password' }, user?.id);
      // Navigation happens via the isAuthenticated redirect once /users/me resolves.
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={goBack} hitSlop={8}>
          <Text className="text-base text-oak">‹ Inicio</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center px-6">
          <Image
            source={require('../../assets/images/ios-icon.png')}
            className="mb-6 h-14 w-14 rounded-2xl"
            accessibilityIgnoresInvertColors
          />
          <Text className="mb-2 text-4xl text-ink" style={{ fontFamily: serif }}>
            Hola de nuevo
          </Text>
          <Text className="mb-8 text-base text-mutedForeground">Inicia sesión para gestionar tu mesa de regalos.</Text>

          <Text className="mb-1 text-sm font-medium text-foreground">Correo electrónico</Text>
          <TextInput
            className="mb-4 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#949ca4"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="mb-1 text-sm font-medium text-foreground">Contraseña</Text>
          <TextInput
            className="mb-2 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="••••••••"
            placeholderTextColor="#949ca4"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
          />

          <Pressable
            className="mb-6 self-end py-1"
            onPress={() => router.push('/forgot-password')}
            hitSlop={8}
          >
            <Text className="text-sm font-medium text-oak">¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Pressable
            className="items-center rounded-full bg-oak py-4 active:bg-oakDark"
            disabled={submitting}
            onPress={onSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable className="mt-5 items-center py-1" onPress={() => router.push('/signup')} hitSlop={8}>
            <Text className="text-sm text-mutedForeground">
              ¿No tienes cuenta? <Text className="font-semibold text-oak">Regístrate</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
