import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Gift } from 'types/models/gift';
import {
  contributionPresets,
  minContributionFor,
  remainingAmount,
  shareAmount,
  sharesRemaining,
  validateContribution,
  validateShares,
} from 'utils/giftFunding';

import { formatCurrency } from '@/lib/format';
import { FundingMeter, fundingSummary } from './FundingMeter';

/**
 * Where a guest decides what to chip in, as a native sheet.
 *
 * Same rule as the web picker: the number the guest will actually pay is the
 * largest thing on screen. For a fixed split that's the per-person share — the
 * gift's total is context, not the ask. Presets keep the common intents ("a
 * bit", "half", "I'll finish it") to a single tap, so most guests never see a
 * keyboard.
 */

interface ContributionSheetProps {
  visible: boolean;
  gift: Gift | null;
  /** Existing line for this gift, when the guest already added something. */
  currentShares?: number;
  currentAmount?: number;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: { shares?: number; amount?: number }) => void;
}

export function ContributionSheet({ visible, gift, currentShares, currentAmount, submitting, onCancel, onSubmit }: ContributionSheetProps) {
  return (
    <Modal visible={visible && !!gift} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-3">
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text className="text-base text-mutedForeground">Cancelar</Text>
          </Pressable>
          <Text className="text-base font-semibold text-ink">Aportar</Text>
          <View className="w-16" />
        </View>

        {gift ? (
          <Body gift={gift} currentShares={currentShares} currentAmount={currentAmount} submitting={submitting} onSubmit={onSubmit} />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function Body({
  gift,
  currentShares,
  currentAmount,
  submitting,
  onSubmit,
}: {
  gift: Gift;
  currentShares?: number;
  currentAmount?: number;
  submitting?: boolean;
  onSubmit: (payload: { shares?: number; amount?: number }) => void;
}) {
  const isFixed = gift.giftType === 'GROUP_FIXED';

  const available = sharesRemaining(gift);
  const remaining = remainingAmount(gift);
  const minimum = minContributionFor(gift);
  const presets = useMemo(() => contributionPresets(gift), [gift.id, gift.amountFunded, gift.price]);

  const [shares, setShares] = useState(1);
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const amountInput = useRef<TextInput>(null);

  useEffect(() => {
    setShares(Math.min(Math.max(1, currentShares ?? 1), Math.max(1, available)));
    setRaw(currentAmount ? String(Math.round(currentAmount)) : presets.length > 0 ? String(presets[0]) : '');
  }, [gift.id, currentShares, currentAmount, available]);

  const shareCheck = validateShares(gift, shares);
  const amountCheck = validateContribution(gift, Number(raw));
  const check = isFixed ? shareCheck : amountCheck;
  const total = isFixed ? shareCheck.amount : amountCheck.ok ? amountCheck.amount : 0;
  const finishesIt = !isFixed && amountCheck.ok && amountCheck.amount >= remaining;

  return (
    <>
      <ScrollView contentContainerClassName="px-5 py-5" keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-3">
          {gift.imageUrl ? (
            <Image source={{ uri: gift.imageUrl }} className="h-20 w-20 rounded-lg bg-gray-100" resizeMode="cover" />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-lg bg-muted">
              <Text className="text-3xl">🎁</Text>
            </View>
          )}
          <View className="flex-1 justify-center">
            <Text className="text-lg font-bold text-ink" numberOfLines={2}>
              {gift.title}
            </Text>
            <Text className="mt-0.5 text-sm text-mutedForeground">
              {isFixed ? `Regalo completo: ${formatCurrency(gift.price)}` : `Meta: ${formatCurrency(gift.price)}`}
            </Text>
          </View>
        </View>

        <View className="mt-5">
          <FundingMeter gift={gift} />
          <Text className="mt-2 text-sm text-mutedForeground">{fundingSummary(gift)}</Text>
        </View>

        <View className="mt-5 rounded-ml bg-muted p-5">
          <Text className="text-xs font-medium uppercase tracking-wide text-mutedForeground">{isFixed ? 'Tu parte' : 'Tu aportación'}</Text>

          {isFixed ? (
            /* The hero number: what THIS guest pays, not what the gift costs. */
            <Text className="mt-1 text-4xl font-bold text-oak">{formatCurrency(shareAmount(gift))}</Text>
          ) : (
            /* This is the only thing on the sheet a guest can type into, so it has
               to look like a field and not like the hero number next to it: white
               against the muted card, a border that answers focus and errors, and
               the currency marks kept outside the editable run. */
            <Pressable
              onPress={() => amountInput.current?.focus()}
              className={`mt-2 flex-row items-center gap-1.5 rounded-ml border-2 bg-white px-4 py-3 ${
                raw !== '' && amountCheck.error ? 'border-warning' : focused ? 'border-oak' : 'border-accent'
              }`}>
              <Text className="text-2xl font-bold text-oak">$</Text>
              <TextInput
                ref={amountInput}
                value={raw}
                onChangeText={(next) => setRaw(next.replace(/[^\d]/g, ''))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                placeholder={String(minimum)}
                placeholderTextColor="#d4b5a5"
                selectionColor="#d4704a"
                accessibilityLabel="Monto de tu aportación"
                className="flex-1 p-0 text-4xl font-bold text-oak"
              />
              <Text className="text-sm font-semibold text-mutedForeground">MXN</Text>
            </Pressable>
          )}

          {!isFixed && <Text className="mt-2 text-xs text-mutedForeground">Escribe un monto o elige uno de abajo</Text>}

          {isFixed && available > 1 && (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-medium text-foreground">¿Cuántas partes quieres cubrir?</Text>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: available }, (_, index) => index + 1).map((count) => (
                  <Chip key={count} label={String(count)} active={shares === count} onPress={() => setShares(count)} />
                ))}
              </View>
            </View>
          )}

          {!isFixed && (
            <>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {presets.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset >= remaining ? `Completar · ${formatCurrency(preset)}` : formatCurrency(preset)}
                    active={Number(raw) === preset}
                    onPress={() => setRaw(String(preset))}
                  />
                ))}
              </View>
              <Text className="mt-3 text-xs text-mutedForeground">
                Mínimo {formatCurrency(minimum)} · Faltan {formatCurrency(remaining)} para la meta
              </Text>
            </>
          )}
        </View>

        {raw !== '' && check.error ? <Text className="mt-3 text-sm text-warning">{check.error}</Text> : null}
      </ScrollView>

      <View className="border-t border-gray-200 bg-white px-5 pb-6 pt-4">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-base text-mutedForeground">
            {finishesIt ? '¡Completas el regalo!' : isFixed ? (shares > 1 ? `${shares} partes` : '1 parte') : 'Aportación'}
          </Text>
          <Text className="text-xl font-bold text-ink">{formatCurrency(total)}</Text>
        </View>

        <Pressable
          onPress={() => check.ok && onSubmit(isFixed ? { shares } : { amount: amountCheck.amount })}
          disabled={!check.ok || submitting}
          className={`mt-4 items-center rounded-full py-3.5 ${check.ok && !submitting ? 'bg-oak active:bg-oakDark' : 'bg-gray-300'}`}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Agregar mi aportación</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full border-2 px-4 py-2 ${active ? 'border-oak bg-oak' : 'border-gray-200 bg-white'}`}>
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}
