import type { GiftListWithGifts } from 'types/models/giftList';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** Sum of purchased gift prices for a list. */
export function getRaisedAmount(list: GiftListWithGifts): number {
  if (!list.gifts) return 0;
  return list.gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0);
}

/**
 * Fund-raising snapshot for a list: how many gifts exist, how many are claimed,
 * the money raised vs. the full value of the list, and the 0–1 completion ratio.
 */
export function getListProgress(list: GiftListWithGifts) {
  const gifts = list.gifts ?? [];
  const total = gifts.length;
  const purchased = gifts.filter((g) => g.isPurchased).length;
  const goal = gifts.reduce((sum, g) => sum + g.price, 0);
  const raised = gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0);
  const ratio = goal > 0 ? raised / goal : 0;
  return { total, purchased, goal, raised, ratio };
}

/** Human "faltan X días" countdown to (or since) an event, in Spanish. */
export function formatEventCountdown(date?: Date | string | null): string | null {
  if (!date) return null;
  const target = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return null;

  const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((atMidnight(target) - atMidnight(new Date())) / 86_400_000);

  if (diffDays === 0) return '¡Es hoy!';
  if (diffDays === 1) return 'Mañana';
  if (diffDays > 1) return `Faltan ${diffDays} días`;
  if (diffDays === -1) return 'Ayer';
  return `Hace ${Math.abs(diffDays)} días`;
}
