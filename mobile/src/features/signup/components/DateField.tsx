import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { formatEventDate } from '@/lib/format';
import { startOfDay } from '../utils';

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/**
 * Event-date field: replaces the web's antd DatePicker with a native modal
 * month calendar. Past dates are disabled (same rule as the web form).
 */
export function DateField({
  value,
  onChange,
  placeholder = 'Selecciona la fecha',
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const initialMonth = value ?? today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth, 1)),
    [viewYear, viewMonth],
  );

  // 6 rows x 7 cols; null cells pad the first/last week.
  const weeks = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array<null>(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectDay = (day: number) => {
    onChange(new Date(viewYear, viewMonth, day));
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-ml border border-gray-200 bg-white px-4 py-3"
        accessibilityRole="button"
        accessibilityLabel="Fecha del evento"
      >
        <Text className={`text-base ${value ? 'text-ink' : 'text-gray-500'}`}>
          {value ? formatEventDate(value) : placeholder}
        </Text>
        <Text className="text-base text-mutedForeground">📅</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-center bg-black/40 px-6" onPress={() => setOpen(false)}>
          <Pressable className="rounded-2xl bg-white p-5" onPress={(e) => e.stopPropagation()}>
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                onPress={() => canGoPrev && shiftMonth(-1)}
                hitSlop={10}
                disabled={!canGoPrev}
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
              >
                <Text className={`px-2 text-2xl ${canGoPrev ? 'text-oak' : 'text-gray-300'}`}>‹</Text>
              </Pressable>
              <Text className="text-base font-semibold capitalize text-ink">{monthLabel}</Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Mes siguiente">
                <Text className="px-2 text-2xl text-oak">›</Text>
              </Pressable>
            </View>

            <View className="flex-row">
              {WEEKDAYS.map((d, i) => (
                <Text key={`${d}-${i}`} className="flex-1 py-1 text-center text-xs font-semibold text-mutedForeground">
                  {d}
                </Text>
              ))}
            </View>

            {weeks.map((week, wi) => (
              <View key={wi} className="flex-row">
                {week.map((day, di) => {
                  if (day == null) return <View key={di} className="m-0.5 h-10 flex-1" />;
                  const date = new Date(viewYear, viewMonth, day);
                  const disabled = date < today;
                  const selected =
                    !!value &&
                    value.getFullYear() === viewYear &&
                    value.getMonth() === viewMonth &&
                    value.getDate() === day;
                  return (
                    <Pressable
                      key={di}
                      disabled={disabled}
                      onPress={() => selectDay(day)}
                      className={`m-0.5 h-10 flex-1 items-center justify-center rounded-full ${
                        selected ? 'bg-oak' : disabled ? '' : 'active:bg-oak/10'
                      }`}
                    >
                      <Text className={`text-sm ${selected ? 'font-bold text-white' : disabled ? 'text-gray-300' : 'text-ink'}`}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
