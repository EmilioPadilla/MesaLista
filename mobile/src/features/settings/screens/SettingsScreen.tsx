import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCurrentUser, useUpdateCurrentUserProfile, useUpdateCurrentUserPassword, useDeleteCurrentUser } from 'hooks/useUser';

import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/lib/ToastProvider';
import { tokenStore } from '@/lib/secureStore';

export function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateCurrentUserProfile();
  const updatePassword = useUpdateCurrentUserPassword();
  const deleteAccount = useDeleteCurrentUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setSpouseFirstName(user.spouseFirstName ?? '');
      setSpouseLastName(user.spouseLastName ?? '');
      setPhoneNumber(user.phoneNumber ?? '');
    }
  }, [user]);

  const saveProfile = () => {
    updateProfile.mutate({ firstName, lastName, spouseFirstName, spouseLastName, phoneNumber });
  };

  const savePassword = () => {
    if (newPassword.length < 8) {
      toast.warning('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    updatePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
        },
      },
    );
  };

  const confirmDelete = () => {
    Alert.alert('¿Eliminar tu cuenta?', 'Esta acción es permanente y eliminará todas tus listas. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar cuenta',
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onSuccess: async () => {
              await tokenStore.clear();
              router.replace('/login');
            },
          }),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-oak">‹ Atrás</Text>
        </Pressable>
        <Text className="text-base font-semibold text-ink">Configuración</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12" keyboardShouldPersistTaps="handled">
        <Section title="Perfil">
          <Labeled label="Nombre">
            <Input value={firstName} onChangeText={setFirstName} placeholder="Nombre" />
          </Labeled>
          <Labeled label="Apellido">
            <Input value={lastName} onChangeText={setLastName} placeholder="Apellido" />
          </Labeled>
          <Labeled label="Nombre de tu pareja">
            <Input value={spouseFirstName} onChangeText={setSpouseFirstName} placeholder="Opcional" />
          </Labeled>
          <Labeled label="Apellido de tu pareja">
            <Input value={spouseLastName} onChangeText={setSpouseLastName} placeholder="Opcional" />
          </Labeled>
          <Labeled label="Teléfono">
            <Input value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Opcional" keyboardType="phone-pad" />
          </Labeled>
          <PrimaryButton label="Guardar perfil" loading={updateProfile.isPending} onPress={saveProfile} />
        </Section>

        <Section title="Contraseña">
          <Labeled label="Contraseña actual">
            <Input value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" secureTextEntry />
          </Labeled>
          <Labeled label="Nueva contraseña">
            <Input value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo 8 caracteres" secureTextEntry />
          </Labeled>
          <PrimaryButton label="Cambiar contraseña" loading={updatePassword.isPending} onPress={savePassword} />
        </Section>

        <Section title="Cuenta">
          <Text className="mb-3 text-sm text-mutedForeground">{user?.email}</Text>
          <Pressable className="mb-3 items-center rounded-ml border border-gray-200 py-3 active:bg-gray-100" onPress={logout}>
            <Text className="text-base font-semibold text-ink">Cerrar sesión</Text>
          </Pressable>
          <Pressable className="items-center rounded-ml border border-danger/40 py-3 active:bg-danger/5" onPress={confirmDelete}>
            {deleteAccount.isPending ? (
              <ActivityIndicator color="#dc3545" />
            ) : (
              <Text className="text-base font-semibold text-danger">Eliminar cuenta</Text>
            )}
          </Pressable>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</Text>
      <View className="rounded-ml border border-gray-200 bg-white p-4">{children}</View>
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-foreground">{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#949ca4"
      className="rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
      autoCapitalize="none"
      {...props}
    />
  );
}

function PrimaryButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable className="mt-1 items-center rounded-ml bg-oak py-3 active:bg-oakDark" disabled={loading} onPress={onPress}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-base font-semibold text-white">{label}</Text>}
    </Pressable>
  );
}
