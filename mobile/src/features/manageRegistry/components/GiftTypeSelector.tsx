import { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import type { GiftType } from 'types/models/gift';
import {
  DEFAULT_MIN_CONTRIBUTION,
  GIFT_TYPE_HINTS,
  GIFT_TYPE_LABELS,
  MIN_CONTRIBUTOR_TARGET,
  shareAmount,
} from 'utils/giftFunding';

import { formatCurrency } from '@/lib/format';

/**
 * Native twin of the web gift-type picker. Almost every gift is a plain
 * individual gift, so the choice stays folded into a single summary row and only
 * unfolds when the couple taps it — three stacked tiles cost more of a phone
 * screen than the decision is worth. Unfolded, each tile carries a diagram of its
 * own mechanic rather than relying on the couple reading three sentences, and
 * those segments are the same mark guests will see on the gift.
 */

const TYPES: GiftType[] = ['SINGLE', 'GROUP_FIXED', 'GROUP_OPEN'];

interface GiftTypeSelectorProps {
  value: GiftType;
  onChange: (value: GiftType) => void;
  price: number;
  contributorTarget: string;
  onContributorTargetChange: (value: string) => void;
  minContribution: string;
  onMinContributionChange: (value: string) => void;
  /** Guests have already paid in: funding terms are frozen (the server enforces it). */
  locked?: boolean;
}

export function GiftTypeSelector({
  value,
  onChange,
  price,
  contributorTarget,
  onContributorTargetChange,
  minContribution,
  onMinContributionChange,
  locked = false,
}: GiftTypeSelectorProps) {
  const target = Number(contributorTarget) || 0;
  const perShare =
    price > 0 && target >= MIN_CONTRIBUTOR_TARGET
      ? shareAmount({ price, giftType: 'GROUP_FIXED', contributorTarget: target, amountFunded: 0 })
      : null;

  /**
   * Anything other than a plain gift starts unfolded: the couple either just
   * picked it or is editing it, and its terms live inside the panel.
   */
  const [open, setOpen] = useState(value !== 'SINGLE');

  const summary = (() => {
    if (value === 'GROUP_FIXED') {
      return perShare !== null
        ? `${target} partes de ${formatCurrency(perShare)} cada una.`
        : GIFT_TYPE_HINTS.GROUP_FIXED;
    }
    if (value === 'GROUP_OPEN') {
      const floor = Number(minContribution) || DEFAULT_MIN_CONTRIBUTION;
      return `Cada quien aporta lo que quiera, desde ${formatCurrency(floor)}.`;
    }
    return GIFT_TYPE_HINTS.SINGLE;
  })();

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">¿Cómo se paga este regalo?</Text>
        {locked ? <Text className="text-xs text-mutedForeground">🔒 Fijo</Text> : null}
      </View>

      {/* The folded state: what's chosen right now, and the way in. */}
      <Pressable
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={`flex-row items-center gap-3 rounded-ml border bg-muted px-4 py-3 ${
          open ? 'border-oak/40' : 'border-accent'
        }`}
      >
        <View className="w-9">
          <TypeDiagram type={value} selected />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{GIFT_TYPE_LABELS[value]}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-mutedForeground">
            {summary}
          </Text>
        </View>
        <Text className="text-xs font-medium text-oak">{open ? 'Listo ▴' : 'Cambiar ▾'}</Text>
      </Pressable>

      {open ? (
        <View className="mt-3 gap-2">
          {TYPES.map((type) => {
            const selected = value === type;
            return (
              <Pressable
                key={type}
                onPress={() => !locked && onChange(type)}
                disabled={locked && !selected}
                className={`rounded-ml border-2 p-3 ${
                  selected ? 'border-oak bg-oak/5' : 'border-gray-200 bg-white'
                } ${locked && !selected ? 'opacity-40' : ''}`}
              >
                <TypeDiagram type={type} selected={selected} />
                <Text className={`mt-2 text-sm font-semibold ${selected ? 'text-oak' : 'text-ink'}`}>
                  {GIFT_TYPE_LABELS[type]}
                </Text>
                <Text className="mt-0.5 text-xs text-mutedForeground">{GIFT_TYPE_HINTS[type]}</Text>
              </Pressable>
            );
          })}

          {value === 'GROUP_FIXED' ? (
            <View className="mt-1 rounded-ml border border-accent bg-muted p-4">
              <Text className="text-sm font-medium text-foreground">¿Entre cuántas personas se divide?</Text>
              <TextInput
                className="mt-2 w-24 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                placeholder="3"
                placeholderTextColor="#949ca4"
                keyboardType="number-pad"
                editable={!locked}
                value={contributorTarget}
                onChangeText={(next) => onContributorTargetChange(next.replace(/[^\d]/g, ''))}
              />
              {/* The number that matters to a guest, updating as the couple types. */}
              <Text className="mt-2 text-sm text-mutedForeground">
                {perShare !== null ? (
                  <>
                    Cada persona aporta <Text className="font-bold text-oak">{formatCurrency(perShare)}</Text>
                  </>
                ) : (
                  'Escribe un precio y un número de partes'
                )}
              </Text>
            </View>
          ) : null}

          {value === 'GROUP_OPEN' ? (
            <View className="mt-1 rounded-ml border border-accent bg-muted p-4">
              <Text className="text-sm font-medium text-foreground">Aportación mínima (opcional)</Text>
              <TextInput
                className="mt-2 w-32 rounded-ml border border-gray-200 bg-white px-4 py-3 text-base text-ink"
                placeholder={String(DEFAULT_MIN_CONTRIBUTION)}
                placeholderTextColor="#949ca4"
                keyboardType="number-pad"
                editable={!locked}
                value={minContribution}
                onChangeText={(next) => onMinContributionChange(next.replace(/[^\d]/g, ''))}
              />
              <Text className="mt-2 text-xs text-mutedForeground">
                Si lo dejas vacío usamos ${DEFAULT_MIN_CONTRIBUTION}. El precio del regalo es la meta.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** One bar = one buyer; equal segments = an even split; a part-filled meter = an open pour. */
function TypeDiagram({ type, selected }: { type: GiftType; selected: boolean }) {
  const filled = selected ? 'bg-oak' : 'bg-gray-300';
  const empty = selected ? 'bg-oak/20' : 'bg-gray-200';

  if (type === 'SINGLE') {
    return <View className={`h-2 w-full rounded-full ${filled}`} />;
  }

  if (type === 'GROUP_FIXED') {
    return (
      <View className="w-full flex-row gap-1">
        <View className={`h-2 flex-1 rounded-full ${filled}`} />
        <View className={`h-2 flex-1 rounded-full ${empty}`} />
        <View className={`h-2 flex-1 rounded-full ${empty}`} />
      </View>
    );
  }

  return (
    <View className={`h-2 w-full overflow-hidden rounded-full ${empty}`}>
      <View className={`h-full rounded-full ${filled}`} style={{ width: '40%' }} />
    </View>
  );
}
