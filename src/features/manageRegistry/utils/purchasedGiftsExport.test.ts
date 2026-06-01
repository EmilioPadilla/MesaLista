import { describe, it, expect } from 'vitest';
import {
  buildPurchasedGiftsCsv,
  buildKeepsakeFilename,
  escapeCsvCell,
  toKeepsakeRow,
} from './purchasedGiftsExport';
import type { PurchasedGift } from 'src/services/payment.service';

// The keepsake export is the only place these payments end up outside the app, so
// any silent data loss here is invisible until a couple tries to download "their
// memories" and finds them mangled. These tests pin the shape: messages with commas,
// quotes, and newlines must survive a round trip through Excel/Numbers without
// breaking column alignment.

const baseGift = (overrides: Partial<PurchasedGift> = {}): PurchasedGift => ({
  id: 1,
  giftTitle: 'Juego de sábanas',
  guestName: 'María López',
  guestEmail: 'maria@example.com',
  message: 'Felicidades a los novios',
  quantity: 1,
  price: 1500,
  totalPrice: 1500,
  categories: 'Hogar',
  paymentType: 'STRIPE',
  paymentDate: '2026-04-12T10:00:00.000Z',
  currency: 'MXN',
  rsvpInvitee: { firstName: 'María', lastName: 'López', status: 'CONFIRMED' },
  ...overrides,
});

describe('escapeCsvCell', () => {
  it('passes plain values through unquoted', () => {
    expect(escapeCsvCell('hola')).toBe('hola');
    expect(escapeCsvCell(42)).toBe('42');
  });

  it('quotes values containing commas', () => {
    expect(escapeCsvCell('a, b')).toBe('"a, b"');
  });

  it('quotes and double-escapes embedded quotes', () => {
    // RFC 4180: a literal " inside a quoted field becomes "".
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('quotes newline-bearing strings so rows do not split', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('renders null and undefined as empty strings', () => {
    expect(escapeCsvCell(null as any)).toBe('');
    expect(escapeCsvCell(undefined as any)).toBe('');
  });
});

describe('toKeepsakeRow', () => {
  it('extracts the keepsake-relevant fields, leaving email out', () => {
    const row = toKeepsakeRow(baseGift());
    expect(row).toMatchObject({
      gift: 'Juego de sábanas',
      guest: 'María López',
      rsvpName: 'María López',
      rsvpStatus: 'CONFIRMED',
      message: 'Felicidades a los novios',
      quantity: 1,
    });
    expect(row).not.toHaveProperty('guestEmail');
  });

  it('returns empty RSVP fields when the cart was not tied to an invitee', () => {
    const row = toKeepsakeRow(baseGift({ rsvpInvitee: null }));
    expect(row.rsvpName).toBe('');
    expect(row.rsvpStatus).toBe('');
  });

  it('formats totals in MXN currency', () => {
    const row = toKeepsakeRow(baseGift({ totalPrice: 2500, currency: 'MXN' }));
    expect(row.total).toMatch(/2,500/);
  });

  it('falls back to an empty date string when payment date is unparseable', () => {
    const row = toKeepsakeRow(baseGift({ paymentDate: 'not-a-date' }));
    expect(row.paymentDate).toBe('');
  });

  it('handles a null message without throwing', () => {
    const row = toKeepsakeRow(baseGift({ message: null as any }));
    expect(row.message).toBe('');
  });
});

describe('buildPurchasedGiftsCsv', () => {
  it('includes a header row with the keepsake-relevant labels', () => {
    const csv = buildPurchasedGiftsCsv([]);
    // Strip BOM for assertion clarity.
    const headerLine = csv.replace(/^﻿/, '').split('\n')[0];
    expect(headerLine).toContain('Regalo');
    expect(headerLine).toContain('Invitado');
    expect(headerLine).toContain('Mensaje');
    expect(headerLine).toContain('Total');
    // Email is intentionally excluded — this is a couple's keepsake, not a CRM export.
    expect(headerLine).not.toContain('Email');
  });

  it('begins with a UTF-8 BOM so Excel preserves accents', () => {
    // Without the BOM, Excel-on-Windows shows María as MarÃa, which a couple would
    // not realise until they printed the keepsake.
    const csv = buildPurchasedGiftsCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('escapes a message containing commas, quotes and newlines', () => {
    // We assert on the substring rather than line-splitting because a naive split on
    // \n would also break the quoted cell — only a real CSV parser would honour the
    // quotes. What matters is that the cell itself is correctly quoted-and-escaped.
    const csv = buildPurchasedGiftsCsv([baseGift({ message: 'Hola, "amigo"\ncuídate' })]);
    expect(csv).toContain('"Hola, ""amigo""\ncuídate"');
  });

  it('renders every purchase as its own row', () => {
    const csv = buildPurchasedGiftsCsv([
      baseGift({ id: 1, giftTitle: 'A' }),
      baseGift({ id: 2, giftTitle: 'B' }),
      baseGift({ id: 3, giftTitle: 'C' }),
    ]);
    const lines = csv.replace(/^﻿/, '').split('\n');
    expect(lines.length).toBe(4);
    expect(lines[1]).toContain('A');
    expect(lines[2]).toContain('B');
    expect(lines[3]).toContain('C');
  });
});

describe('buildKeepsakeFilename', () => {
  it('formats the filename with the date in ISO-style components', () => {
    const filename = buildKeepsakeFilename(new Date('2026-04-12T10:00:00.000Z'));
    expect(filename).toMatch(/^recuerdos-regalos-2026-04-\d{2}\.csv$/);
  });

  it('zero-pads single-digit month and day', () => {
    const filename = buildKeepsakeFilename(new Date(2026, 0, 3));
    expect(filename).toBe('recuerdos-regalos-2026-01-03.csv');
  });
});
