import { Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Horizontal pill segmented control. Used for the analytics section switcher
 * and the date-range presets. Scrolls horizontally when options overflow.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              className={`rounded-full border px-4 py-2 ${
                active ? 'border-oak bg-oak' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-mutedForeground'}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
