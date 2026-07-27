import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { userService } from 'services/user.service';

import { useToast } from '@/lib/ToastProvider';

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const onSubmit = async () => {
    const value = email.trim();
    if (!value) {
      toast.warning('Ingresa tu correo electrónico');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      toast.warning('Ingresa un correo válido');
      return;
    }
    setSubmitting(true);
    try {
      await userService.requestPasswordReset(value, 'app');
      setEmailSent(true);
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      if (err?.response) {
        // The endpoint always answers 200 whether or not the account exists, so a
        // server error tells us nothing about the email. Show the same confirmation
        // as the web app to avoid revealing which accounts are registered.
        setEmailSent(true);
      } else {
        // No response at all: connectivity problem, not an enumeration signal.
        toast.error('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable onPress={goToLogin} hitSlop={8}>
          <Text className="text-base text-oak">‹ Iniciar sesión</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center px-6">
          {emailSent ? (
            <>
              <Text className="mb-2 text-4xl text-ink" style={{ fontFamily: serif }}>
                Correo enviado
              </Text>
              <Text className="mb-8 text-base text-mutedForeground">
                Si el correo existe, recibirás un enlace para restablecer tu contraseña. Ábrelo desde tu bandeja de
                entrada y regresa aquí para iniciar sesión. Si no llega en unos minutos, revisa tu carpeta de spam.
              </Text>

              <Pressable
                className="items-center rounded-full bg-oak py-4 active:bg-oakDark"
                onPress={goToLogin}
              >
                <Text className="text-base font-semibold text-white">Volver a iniciar sesión</Text>
              </Pressable>

              <Pressable className="mt-5 items-center py-1" onPress={() => setEmailSent(false)} hitSlop={8}>
                <Text className="text-sm text-mutedForeground">
                  ¿No lo recibiste? <Text className="font-semibold text-oak">Enviar otro correo</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mb-2 text-4xl text-ink" style={{ fontFamily: serif }}>
                ¿Olvidaste tu contraseña?
              </Text>
              <Text className="mb-8 text-base text-mutedForeground">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
              </Text>

              <Text className="mb-1 text-sm font-medium text-foreground">Correo electrónico</Text>
              <TextInput
                className="mb-6 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor="#949ca4"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={onSubmit}
              />

              <Pressable
                className="items-center rounded-full bg-oak py-4 active:bg-oakDark"
                disabled={submitting}
                onPress={onSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Enviar enlace</Text>
                )}
              </Pressable>

              <Pressable className="mt-5 items-center py-1" onPress={goToLogin} hitSlop={8}>
                <Text className="text-sm text-mutedForeground">
                  ¿Recordaste tu contraseña? <Text className="font-semibold text-oak">Inicia sesión</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
