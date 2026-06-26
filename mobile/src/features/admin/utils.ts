/** Formatting helpers for the admin surface. Mirrors the web admin's display
 * conventions (MXN currency, es-MX locale) so the two platforms read alike. */

export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('es-MX').format(value ?? 0);
}

/** Renders a 0–1 rate as a percentage. Rates from the API are fractions. */
export function formatRate(rate: number | null | undefined): string {
  return `${Math.round((rate ?? 0) * 100)}%`;
}

export function formatDurationMs(ms: number | null | undefined): string {
  const total = Math.round((ms ?? 0) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export type AdminDateRange = 'today' | 'last7days' | 'last30days';

export const DATE_RANGE_LABELS: Record<AdminDateRange, string> = {
  today: 'Hoy',
  last7days: '7 días',
  last30days: '30 días',
};

/** ISO `from`/`to` bounds for a preset range, matching the web AnalyticsPage. */
export function dateRangeBounds(range: AdminDateRange): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now);
  switch (range) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'last7days':
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case 'last30days':
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      break;
  }
  return { from: from.toISOString(), to };
}
