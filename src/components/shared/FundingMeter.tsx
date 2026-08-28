import { memo } from 'react';
import type { Gift } from 'types/models/gift';
import {
  contributionPresets,
  fundingGoal,
  fundingPercent,
  isFullyFunded,
  remainingAmount,
  shareAmount,
  sharesClaimed,
  sharesRemaining,
} from 'src/utils/giftFunding';

/**
 * The progress language for group gifts, shared by the gift grid, the gift
 * details modal and the couple's manage view so a gift looks the same wherever
 * it's seen.
 *
 * Two deliberately different marks, because the two variants are different
 * promises. An open goal is a continuous pour, so it gets a filling bar. A fixed
 * split is a countable set of places at a table, so it gets discrete segments —
 * "2 of 3 spots taken" reads instantly from the shape alone, without the label.
 */

const money = (value: number) => `$${Math.round(value).toLocaleString('es-MX')}`;

interface FundingMeterProps {
  gift: Pick<Gift, 'price' | 'giftType' | 'amountFunded' | 'contributorTarget' | 'minContribution' | 'contributorCount'>;
  /** Compact drops the caption row — for dense cards in the grid. */
  size?: 'default' | 'compact';
  className?: string;
}

const FundingMeterComponent = ({ gift, size = 'default', className = '' }: FundingMeterProps) => {
  if (gift.giftType === 'SINGLE') return null;

  const complete = isFullyFunded(gift);
  const compact = size === 'compact';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {gift.giftType === 'GROUP_FIXED' ? <ShareStrip gift={gift} /> : <GoalBar gift={gift} />}

      <div className={`flex items-baseline justify-between gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className={complete ? 'font-semibold text-green-600' : 'font-semibold text-[#d4704a]'}>
          {complete ? '¡Completo!' : gift.giftType === 'GROUP_FIXED' ? fixedLabel(gift) : money(gift.amountFunded)}
        </span>
        <span className="text-gray-500">
          {complete ? completeCaption(gift) : gift.giftType === 'GROUP_FIXED' ? shareCaption(gift) : goalCaption(gift)}
        </span>
      </div>
    </div>
  );
};

/** "2 de 3 partes" — the countable framing a split gift deserves. */
function fixedLabel(gift: FundingMeterProps['gift']): string {
  return `${sharesClaimed(gift)} de ${gift.contributorTarget ?? 0} partes`;
}

function shareCaption(gift: FundingMeterProps['gift']): string {
  return `${money(shareAmount(gift))} c/u`;
}

function goalCaption(gift: FundingMeterProps['gift']): string {
  return `de ${money(fundingGoal(gift))}`;
}

function completeCaption(gift: FundingMeterProps['gift']): string {
  const count = gift.contributorCount ?? 0;
  if (count <= 0) return money(fundingGoal(gift));
  return count === 1 ? '1 persona' : `${count} personas`;
}

/** Continuous fill for an open-ended goal. */
function GoalBar({ gift }: { gift: FundingMeterProps['gift'] }) {
  const percent = fundingPercent(gift);
  const complete = isFullyFunded(gift);

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-[#e8ddd4]"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent}% recaudado`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
          complete ? 'bg-green-500' : 'bg-gradient-to-r from-[#d2a880] to-[#d4704a]'
        }`}
        // A hair of width on an empty bar so the meter still reads as a
        // container waiting to be filled rather than as an empty rule.
        style={{ width: percent === 0 ? '4px' : `${percent}%` }}
      />
    </div>
  );
}

/**
 * Discrete segments for a fixed split — one per share, filled as they're claimed.
 *
 * Capped at a dozen segments: past that the strip stops being countable at a
 * glance, which is the only reason to draw it, so it degrades to a plain bar.
 */
function ShareStrip({ gift }: { gift: FundingMeterProps['gift'] }) {
  const target = gift.contributorTarget ?? 0;
  if (target > 12) return <GoalBar gift={gift} />;

  const claimed = sharesClaimed(gift);

  return (
    <div
      className="flex w-full gap-1"
      role="progressbar"
      aria-valuenow={claimed}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={`${claimed} de ${target} partes tomadas`}>
      {Array.from({ length: target }, (_, index) => (
        <span
          key={index}
          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
            index < claimed ? 'bg-[#d4704a]' : 'bg-[#e8ddd4]'
          }`}
        />
      ))}
    </div>
  );
}

export const FundingMeter = memo(FundingMeterComponent);

/**
 * The one-line status a guest reads before deciding to chip in. Kept next to the
 * meter so the wording can't drift between the card and the modal.
 */
export function fundingSummary(
  gift: Pick<Gift, 'price' | 'giftType' | 'amountFunded' | 'contributorTarget' | 'minContribution' | 'isPurchased'>,
): string {
  if (gift.giftType === 'SINGLE') return '';
  if (isFullyFunded(gift)) return 'Este regalo ya está completo';

  if (gift.giftType === 'GROUP_FIXED') {
    const left = sharesRemaining(gift);
    return left === 1 ? 'Queda 1 parte por tomar' : `Quedan ${left} partes por tomar`;
  }

  return `Faltan ${money(remainingAmount(gift))} para la meta`;
}

export { contributionPresets, remainingAmount, shareAmount, sharesRemaining, isFullyFunded };
