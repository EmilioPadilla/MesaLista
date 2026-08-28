import { useEffect, useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { Pencil, Users } from 'lucide-react';
import type { Gift } from 'types/models/gift';
import {
  contributionPresets,
  minContributionFor,
  remainingAmount,
  shareAmount,
  sharesRemaining,
  validateContribution,
  validateShares,
} from 'src/utils/giftFunding';
import { FundingMeter, fundingSummary } from 'src/components/shared/FundingMeter';

/**
 * Where a guest decides what to chip in.
 *
 * The design rule here: the number the guest will actually pay is the biggest
 * thing on screen, always. For a fixed split that's the per-person share — the
 * gift's total is context, not the ask. For an open goal it's whatever they've
 * chosen, updating live as they tap a preset or type.
 *
 * Presets exist so the common cases ("a bit", "half", "I'll finish it") are one
 * tap and most guests never open a keyboard.
 */

interface ContributionPickerProps {
  gift: Gift;
  /** Existing line for this gift, if the guest already put something in the cart. */
  currentShares?: number;
  currentAmount?: number;
  onSubmit: (payload: { shares?: number; amount?: number }) => void;
  submitting?: boolean;
}

const money = (value: number) => `$${Math.round(value).toLocaleString('es-MX')}`;

export function ContributionPicker({ gift, currentShares, currentAmount, onSubmit, submitting }: ContributionPickerProps) {
  return gift.giftType === 'GROUP_FIXED' ? (
    <SharePicker gift={gift} currentShares={currentShares} onSubmit={onSubmit} submitting={submitting} />
  ) : (
    <AmountPicker gift={gift} currentAmount={currentAmount} onSubmit={onSubmit} submitting={submitting} />
  );
}

/** GROUP_FIXED — pick how many of the equal shares to cover. */
function SharePicker({
  gift,
  currentShares,
  onSubmit,
  submitting,
}: {
  gift: Gift;
  currentShares?: number;
  onSubmit: (payload: { shares?: number; amount?: number }) => void;
  submitting?: boolean;
}) {
  const available = sharesRemaining(gift);
  const perShare = shareAmount(gift);
  const [shares, setShares] = useState(1);

  useEffect(() => {
    setShares(Math.min(Math.max(1, currentShares ?? 1), Math.max(1, available)));
  }, [currentShares, available, gift.id]);

  const check = validateShares(gift, shares);

  return (
    <div className="space-y-5">
      <FundingMeter gift={gift} />
      <p className="text-sm text-gray-600">{fundingSummary(gift)}</p>

      <div className="rounded-2xl bg-[#faf7f4] p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tu parte</div>
        {/* The hero number: what this guest pays, not what the gift costs. */}
        <div className="mt-1 text-4xl font-semibold tracking-tight text-[#d4704a]">{money(perShare)}</div>

        {available > 1 && (
          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-gray-700">¿Cuántas partes quieres cubrir?</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: available }, (_, index) => index + 1).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setShares(count)}
                  aria-pressed={shares === count}
                  className={`h-11 min-w-11 rounded-full border-2 px-4 text-sm font-semibold transition-all duration-150 ${
                    shares === count
                      ? 'border-[#d4704a] bg-[#d4704a] text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#d4704a]/40'
                  }`}>
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <SubmitRow
        total={check.amount}
        label={shares > 1 ? `${shares} partes` : '1 parte'}
        disabled={!check.ok || submitting}
        error={check.error}
        submitting={submitting}
        onSubmit={() => check.ok && onSubmit({ shares })}
      />
    </div>
  );
}

/** GROUP_OPEN — pick any amount, up to what's left. */
function AmountPicker({
  gift,
  currentAmount,
  onSubmit,
  submitting,
}: {
  gift: Gift;
  currentAmount?: number;
  onSubmit: (payload: { shares?: number; amount?: number }) => void;
  submitting?: boolean;
}) {
  const presets = useMemo(() => contributionPresets(gift), [gift]);
  const remaining = remainingAmount(gift);
  const minimum = minContributionFor(gift);

  const [raw, setRaw] = useState('');

  useEffect(() => {
    // Reopening on a gift already in the cart should show what they chose, not a
    // blank field they'd have to re-derive.
    setRaw(currentAmount ? String(Math.round(currentAmount)) : presets.length > 0 ? String(presets[0]) : '');
  }, [currentAmount, gift.id]);

  const parsed = Number(raw);
  const check = validateContribution(gift, parsed);
  const finishesIt = check.ok && check.amount >= remaining;

  return (
    <div className="space-y-5">
      <FundingMeter gift={gift} />
      <p className="text-sm text-gray-600">{fundingSummary(gift)}</p>

      <div className="rounded-2xl bg-[#faf7f4] p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tu aportación</div>

        {/* The amount is the only thing on this card a guest can type into, and it
            sits next to numbers that are pure display — so it carries the whole
            vocabulary of a field: white fill against the tinted card, a border
            that answers hover/focus/error, and a pencil that says "editable"
            before anyone clicks. The currency marks stay outside the input so the
            editable run is only ever the digits. */}
        <label
          className={`mt-2 flex cursor-text items-center gap-2 rounded-xl border-2 bg-white px-4 py-3 transition-colors duration-150 focus-within:ring-4 focus-within:ring-[#d4704a]/15 ${
            raw && check.error ? 'border-[#ff9500]' : 'border-gray-300 hover:border-[#d4704a]/60 focus-within:border-[#d4704a]'
          }`}>
          <span className="text-2xl font-semibold leading-none text-[#d4704a]">$</span>
          <div className="min-w-0 flex-1">
            <Input
              value={raw}
              onChange={(event) => setRaw(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder={String(minimum)}
              aria-label="Monto a aportar"
              className="border-0! bg-transparent! p-0! text-4xl! font-semibold! tracking-tight! text-[#d4704a]! shadow-none! focus:shadow-none!"
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-gray-400">MXN</span>
          <Pencil className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </label>

        <p className="mt-2 text-xs text-gray-500">Escribe un monto o elige uno de abajo</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = parsed === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setRaw(String(preset))}
                aria-pressed={active}
                className={`h-10 rounded-full border-2 px-4 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'border-[#d4704a] bg-[#d4704a] text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#d4704a]/40'
                }`}>
                {preset >= remaining ? `Completar · ${money(preset)}` : money(preset)}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Mínimo {money(minimum)} · Faltan {money(remaining)} para la meta
        </p>
      </div>

      <SubmitRow
        total={check.ok ? check.amount : 0}
        label={finishesIt ? '¡Completas el regalo!' : 'Aportación'}
        disabled={!check.ok || submitting}
        error={raw ? check.error : undefined}
        submitting={submitting}
        onSubmit={() => check.ok && onSubmit({ amount: check.amount })}
      />
    </div>
  );
}

function SubmitRow({
  total,
  label,
  disabled,
  error,
  submitting,
  onSubmit,
}: {
  total: number;
  label: string;
  disabled?: boolean;
  error?: string;
  submitting?: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-xl font-semibold text-gray-900">{money(total)}</span>
      </div>

      {error && <p className="text-sm text-[#ff9500]">{error}</p>}

      <Button type="primary" size="large" block disabled={disabled} onClick={onSubmit} icon={<Users className="h-4 w-4" />}>
        {submitting ? 'Agregando…' : 'Agregar mi aportación'}
      </Button>
    </div>
  );
}
