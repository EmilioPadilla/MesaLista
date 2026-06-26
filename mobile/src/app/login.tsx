import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/lib/ToastProvider';

export default function LoginScreen() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  const onSubmit = async () => {
    if (!email || !password) {
      toast.warning('Ingresa tu correo y contraseña');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Navigation happens via the isAuthenticated redirect once /users/me resolves.
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-ink">MesaLista</Text>
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
            className="mb-6 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
            placeholder="••••••••"
            placeholderTextColor="#949ca4"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
          />

          <Pressable
            className="items-center rounded-ml bg-oak py-4 active:bg-oakDark"
            disabled={submitting}
            onPress={onSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable className="mt-4 items-center py-2" onPress={() => router.push('/explore')}>
            <Text className="text-base font-medium text-oak">Explorar mesas de regalos →</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
