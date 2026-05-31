import type { PurchasedGift } from 'src/services/payment.service';

export interface KeepsakeRow {
  gift: string;
  guest: string;
  rsvpName: string;
  rsvpStatus: string;
  message: string;
  quantity: number;
  total: string;
  paymentDate: string;
}

const CSV_HEADERS: Array<{ key: keyof KeepsakeRow; label: string }> = [
  { key: 'gift', label: 'Regalo' },
  { key: 'guest', label: 'Invitado' },
  { key: 'rsvpName', label: 'Nombre RSVP' },
  { key: 'rsvpStatus', label: 'Estado RSVP' },
  { key: 'message', label: 'Mensaje' },
  { key: 'quantity', label: 'Cantidad' },
  { key: 'total', label: 'Total' },
  { key: 'paymentDate', label: 'Fecha' },
];

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: (currency || 'MXN').toUpperCase() }).format(amount);

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const toKeepsakeRow = (g: PurchasedGift): KeepsakeRow => ({
  gift: g.giftTitle,
  guest: g.guestName,
  rsvpName: g.rsvpInvitee ? `${g.rsvpInvitee.firstName} ${g.rsvpInvitee.lastName}` : '',
  rsvpStatus: g.rsvpInvitee?.status ?? '',
  message: g.message ?? '',
  quantity: g.quantity,
  total: formatCurrency(g.totalPrice, g.currency),
  paymentDate: formatDate(g.paymentDate),
});

// RFC 4180 quoting: wrap in double quotes whenever the value contains a quote, comma,
// or newline; escape embedded quotes by doubling them. Plain values pass through bare
// so the file stays readable in Excel/Numbers.
export const escapeCsvCell = (value: string | number): string => {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildPurchasedGiftsCsv = (gifts: PurchasedGift[]): string => {
  const headerRow = CSV_HEADERS.map((h) => escapeCsvCell(h.label)).join(',');
  const dataRows = gifts.map((g) => {
    const row = toKeepsakeRow(g);
    return CSV_HEADERS.map((h) => escapeCsvCell(row[h.key])).join(',');
  });
  // Prepend UTF-8 BOM so Excel on Windows reads accented Spanish characters correctly.
  return '﻿' + [headerRow, ...dataRows].join('\n');
};

export const buildKeepsakeFilename = (date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `recuerdos-regalos-${yyyy}-${mm}-${dd}.csv`;
};
