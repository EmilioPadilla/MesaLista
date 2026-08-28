import { InputNumber, Tooltip } from 'antd';
import { ChevronDown, Lock } from 'lucide-react';
import { useId, useState } from 'react';
import type { GiftType } from 'types/models/gift';
import {
  DEFAULT_MIN_CONTRIBUTION,
  GIFT_TYPE_HINTS,
  GIFT_TYPE_LABELS,
  MAX_CONTRIBUTOR_TARGET,
  MIN_CONTRIBUTOR_TARGET,
  shareAmount,
} from 'src/utils/giftFunding';

/**
 * How a couple chooses the way a gift gets paid for.
 *
 * Almost every gift is a plain individual gift, so the choice stays folded into a
 * single summary row and only unfolds when the couple asks for it — three tiles
 * permanently open cost more of the form than the decision is worth. Unfolded,
 * each tile carries a small diagram of its own mechanic: one solid bar, a row of
 * equal segments, a partly-filled meter. The shapes convey at a glance what three
 * sentences would otherwise have to spell out, and they're the same mark guests
 * will later see on the gift itself, so the couple picks the thing they're
 * actually making.
 */

interface GiftTypeSelectorProps {
  value: GiftType;
  onChange: (value: GiftType) => void;
  /** Current price, so the per-share amount can be previewed live. */
  price?: number;
  contributorTarget?: number | null;
  onContributorTargetChange: (value: number | null) => void;
  minContribution?: number | null;
  onMinContributionChange: (value: number | null) => void;
  /**
   * Set once guests have paid into the gift. The funding terms are frozen at that
   * point (the server enforces it); showing why beats letting the couple try.
   */
  locked?: boolean;
}

const TYPES: GiftType[] = ['SINGLE', 'GROUP_FIXED', 'GROUP_OPEN'];

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
  const target = contributorTarget ?? 0;
  const validTarget = target >= MIN_CONTRIBUTOR_TARGET;
  const perShare =
    price && price > 0 && validTarget
      ? shareAmount({ price, giftType: 'GROUP_FIXED', contributorTarget: target, amountFunded: 0 })
      : null;

  /**
   * Anything other than a plain gift starts unfolded: the couple either just
   * picked it or is editing it, and its terms live inside the panel.
   */
  const [open, setOpen] = useState(value !== 'SINGLE');
  const panelId = useId();

  const summary = (() => {
    if (value === 'GROUP_FIXED') {
      return perShare !== null
        ? `${target} partes de $${perShare.toLocaleString('es-MX')} cada una.`
        : GIFT_TYPE_HINTS.GROUP_FIXED;
    }
    if (value === 'GROUP_OPEN') {
      const floor = minContribution ?? DEFAULT_MIN_CONTRIBUTION;
      return `Cada quien aporta lo que quiera, desde $${floor.toLocaleString('es-MX')}.`;
    }
    return GIFT_TYPE_HINTS.SINGLE;
  })();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">¿Cómo se paga este regalo?</span>
        {locked && (
          <Tooltip title="Ya recibiste aportaciones para este regalo, así que su precio y forma de pago quedan fijos.">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" /> Fijo
            </span>
          </Tooltip>
        )}
      </div>

      {/* The folded state: what's chosen right now, and the way in. */}
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200 ${
          open
            ? 'border-[#d4704a]/40 bg-[#faf7f4]'
            : 'border-[#e8ddd4] bg-[#faf7f4] hover:border-[#d4704a]/40 hover:bg-[#f6efe9]'
        }`}>
        <span className="w-9 shrink-0">
          <TypeDiagram type={value} selected />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">{GIFT_TYPE_LABELS[value]}</span>
          <span className="mt-0.5 block truncate text-xs text-gray-500">{summary}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#d4704a]">
          {open ? 'Listo' : 'Cambiar'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Unfolds with the row rather than replacing it, so nothing jumps. */}
      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}>
        <div className="overflow-hidden">
          <div className="space-y-3 pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TYPES.map((type) => {
                const selected = value === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={locked && !selected}
                    onClick={() => !locked && onChange(type)}
                    aria-pressed={selected}
                    className={`group flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-[#d4704a] bg-[#d4704a]/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-[#d4704a]/40 hover:shadow-sm'
                    } ${locked && !selected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
                    <TypeDiagram type={type} selected={selected} />
                    <div>
                      <div className={`text-sm font-semibold ${selected ? 'text-[#d4704a]' : 'text-gray-900'}`}>
                        {GIFT_TYPE_LABELS[type]}
                      </div>
                      <div className="mt-0.5 text-xs leading-snug text-gray-500">{GIFT_TYPE_HINTS[type]}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {value === 'GROUP_FIXED' && (
              <div className="rounded-2xl border border-[#e8ddd4] bg-[#faf7f4] p-4">
                <label className="text-sm font-medium">¿Entre cuántas personas se divide?</label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <InputNumber
                    min={MIN_CONTRIBUTOR_TARGET}
                    max={MAX_CONTRIBUTOR_TARGET}
                    precision={0}
                    disabled={locked}
                    value={contributorTarget ?? undefined}
                    onChange={(next) => onContributorTargetChange(next === null ? null : Number(next))}
                    placeholder="3"
                    className="w-28"
                  />
                  {/* The number that actually matters to a guest, shown as the couple
                      types — so they set the split against what each person will pay. */}
                  {perShare !== null ? (
                    <span className="text-sm text-gray-600">
                      Cada persona aporta{' '}
                      <strong className="text-[#d4704a]">${perShare.toLocaleString('es-MX')}</strong>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Escribe un precio y un número de partes</span>
                  )}
                </div>
                {validTarget && (
                  <div className="mt-3 flex gap-1" aria-hidden="true">
                    {Array.from({ length: Math.min(target, 12) }, (_, index) => (
                      <span key={index} className="h-1.5 flex-1 rounded-full bg-[#d4704a]/30" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {value === 'GROUP_OPEN' && (
              <div className="rounded-2xl border border-[#e8ddd4] bg-[#faf7f4] p-4">
                <label className="text-sm font-medium">Aportación mínima (opcional)</label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <InputNumber
                    min={1}
                    precision={0}
                    prefix="$"
                    disabled={locked}
                    value={minContribution ?? undefined}
                    onChange={(next) => onMinContributionChange(next === null ? null : Number(next))}
                    placeholder={String(DEFAULT_MIN_CONTRIBUTION)}
                    className="w-36"
                  />
                  <span className="text-sm text-gray-500">
                    Si lo dejas vacío, usamos ${DEFAULT_MIN_CONTRIBUTION} como mínimo.
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  El precio del regalo es la meta. Tus invitados aportan lo que quieran hasta alcanzarla.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The mechanic, drawn. One bar = one buyer; equal segments = an even split; a
 * partly-filled meter = an open pour.
 */
function TypeDiagram({ type, selected }: { type: GiftType; selected: boolean }) {
  const filled = selected ? 'bg-[#d4704a]' : 'bg-gray-300 group-hover:bg-[#d4704a]/50';
  const empty = selected ? 'bg-[#d4704a]/20' : 'bg-gray-200';

  if (type === 'SINGLE') {
    return (
      <div className="flex h-2 w-full" aria-hidden="true">
        <span className={`h-2 w-full rounded-full transition-colors ${filled}`} />
      </div>
    );
  }

  if (type === 'GROUP_FIXED') {
    return (
      <div className="flex h-2 w-full gap-1" aria-hidden="true">
        <span className={`h-2 flex-1 rounded-full transition-colors ${filled}`} />
        <span className={`h-2 flex-1 rounded-full transition-colors ${empty}`} />
        <span className={`h-2 flex-1 rounded-full transition-colors ${empty}`} />
      </div>
    );
  }

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${empty}`} aria-hidden="true">
      <span className={`block h-full w-2/5 rounded-full transition-colors ${filled}`} />
    </div>
  );
}
