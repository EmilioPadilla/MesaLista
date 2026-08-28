import { Text, View } from 'react-native';
import type { Gift } from 'types/models/gift';
import {
  fundingGoal,
  fundingPercent,
  isFullyFunded,
  remainingAmount,
  shareAmount,
  sharesClaimed,
  sharesRemaining,
} from 'utils/giftFunding';

import { formatCurrency } from '@/lib/format';

/**
 * Native twin of the web FundingMeter — same two marks, same wording, so a gift
 * looks like itself whichever app a guest opens.
 *
 * An open goal pours into a continuous bar; a fixed split shows one segment per
 * share, because "2 of 3 spots taken" should be readable from the shape before
 * anyone reads the label.
 */

type MeterGift = Pick<
  Gift,
  'price' | 'giftType' | 'amountFunded' | 'contributorTarget' | 'minContribution' | 'contributorCount'
>;

interface FundingMeterProps {
  gift: MeterGift;
  compact?: boolean;
}

export function FundingMeter({ gift, compact = false }: FundingMeterProps) {
  if (gift.giftType === 'SINGLE') return null;

  const complete = isFullyFunded(gift);

  return (
    <View className="gap-1.5">
      {gift.giftType === 'GROUP_FIXED' ? <ShareStrip gift={gift} /> : <GoalBar gift={gift} />}

      <View className="flex-row items-baseline justify-between">
        <Text className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${complete ? 'text-success' : 'text-oak'}`}>
          {complete
            ? '¡Completo!'
            : gift.giftType === 'GROUP_FIXED'
              ? `${sharesClaimed(gift)} de ${gift.contributorTarget ?? 0} partes`
              : formatCurrency(gift.amountFunded)}
        </Text>
        <Text className={`text-mutedForeground ${compact ? 'text-xs' : 'text-sm'}`}>
          {complete
            ? contributorCaption(gift)
            : gift.giftType === 'GROUP_FIXED'
              ? `${formatCurrency(shareAmount(gift))} c/u`
              : `de ${formatCurrency(fundingGoal(gift))}`}
        </Text>
      </View>
    </View>
  );
}

function contributorCaption(gift: MeterGift): string {
  const count = gift.contributorCount ?? 0;
  if (count <= 0) return formatCurrency(fundingGoal(gift));
  return count === 1 ? '1 persona' : `${count} personas`;
}

function GoalBar({ gift }: { gift: MeterGift }) {
  const percent = fundingPercent(gift);
  const complete = isFullyFunded(gift);

  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-accent">
      <View
        className={`h-full rounded-full ${complete ? 'bg-success' : 'bg-oak'}`}
        // A sliver on an empty bar so it still reads as a container waiting to
        // fill rather than as a plain rule.
        style={{ width: percent === 0 ? 4 : `${percent}%` }}
      />
    </View>
  );
}

/**
 * One segment per share. Past a dozen the strip stops being countable at a
 * glance — the only reason to draw it — so it falls back to a plain bar.
 */
function ShareStrip({ gift }: { gift: MeterGift }) {
  const target = gift.contributorTarget ?? 0;
  if (target > 12) return <GoalBar gift={gift} />;

  const claimed = sharesClaimed(gift);

  return (
    <View className="w-full flex-row gap-1">
      {Array.from({ length: target }, (_, index) => (
        <View key={index} className={`h-2 flex-1 rounded-full ${index < claimed ? 'bg-oak' : 'bg-accent'}`} />
      ))}
    </View>
  );
}

/** The one-line status a guest reads before deciding to chip in. */
export function fundingSummary(gift: MeterGift & { isPurchased?: boolean }): string {
  if (gift.giftType === 'SINGLE') return '';
  if (isFullyFunded(gift)) return 'Este regalo ya está completo';

  if (gift.giftType === 'GROUP_FIXED') {
    const left = sharesRemaining(gift);
    return left === 1 ? 'Queda 1 parte por tomar' : `Quedan ${left} partes por tomar`;
  }

  return `Faltan ${formatCurrency(remainingAmount(gift))} para la meta`;
}
