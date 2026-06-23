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
