import { Text, View } from 'react-native';

/**
 * Compact metric tile used across the admin analytics sections. Lay these out
 * in a wrapping flex row; each tile takes roughly half the row width.
 */
export function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <View
      className={`min-w-[46%] flex-1 rounded-ml border px-4 py-3 ${
        accent ? 'border-oak/30 bg-oak/5' : 'border-gray-200 bg-white'
      }`}
    >
      <Text className={`text-xl font-bold ${accent ? 'text-oak' : 'text-ink'}`} numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-0.5 text-xs font-medium text-mutedForeground">{label}</Text>
      {hint ? <Text className="mt-0.5 text-[11px] text-gray-500">{hint}</Text> : null}
    </View>
  );
}
