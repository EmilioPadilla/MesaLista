import { Text, View } from 'react-native';

import { calculatePasswordStrength, passwordStrengthLabel } from '../utils';

const BAR_COLORS = ['bg-danger', 'bg-danger', 'bg-orange', 'bg-warning', 'bg-success'];

/** Mobile port of the web PasswordStrengthIndicator (bar + requirements list). */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const s = calculatePasswordStrength(password);
  const labelColor = s.score >= 3 ? 'text-success' : s.score >= 2 ? 'text-orange' : 'text-danger';

  return (
    <View className="mb-2 mt-1">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs text-mutedForeground">Seguridad de la contraseña:</Text>
        <Text className={`text-xs font-medium ${labelColor}`}>{passwordStrengthLabel(s.score)}</Text>
      </View>
      <View className="mb-2 flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className={`h-1.5 flex-1 rounded-full ${i < s.score ? BAR_COLORS[s.score] : 'bg-gray-200'}`} />
        ))}
      </View>
      <View className="rounded-ml bg-muted p-3">
        <Text className="mb-1 text-xs font-medium text-mutedForeground">Requisitos:</Text>
        <Requirement met={s.hasMinLength} text="Mínimo 8 caracteres" />
        <Requirement met={s.hasUppercase} text="Al menos una letra mayúscula" />
        <Requirement met={s.hasLowercase} text="Al menos una letra minúscula" />
        <Requirement met={s.hasNumber} text="Al menos un número" />
        <Requirement met={s.hasSpecialChar} text="Carácter especial (opcional)" optional />
      </View>
    </View>
  );
}

function Requirement({ met, text, optional }: { met: boolean; text: string; optional?: boolean }) {
  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      <Text className={`text-xs ${met ? 'text-success' : optional ? 'text-gray-400' : 'text-danger'}`}>{met ? '✓' : '✗'}</Text>
      <Text className={`text-xs ${met ? 'text-success' : optional ? 'text-mutedForeground' : 'text-foreground'}`}>{text}</Text>
    </View>
  );
}
