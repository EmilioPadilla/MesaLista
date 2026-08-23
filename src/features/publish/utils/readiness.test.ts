import { describe, it, expect } from 'vitest';
import { checkPublishReadiness } from './readiness';

// TEST-W3 — publish readiness. The banner says exactly what's missing rather
// than silently disabling the CTA, so the messages are part of the contract.

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
const cover = 'https://cdn.mesalista.com.mx/covers/abc.jpg';

describe('checkPublishReadiness', () => {
  it('is ready with at least one gift, a future event date and a cover image', () => {
    expect(checkPublishReadiness({ giftCount: 1, eventDate: future, coverImageUrl: cover })).toEqual({ ready: true, missing: [] });
  });

  it('blocks an empty registry and names the gap', () => {
    const result = checkPublishReadiness({ giftCount: 0, eventDate: future, coverImageUrl: cover });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(['Agrega al menos un regalo']);
  });

  it('blocks a missing event date', () => {
    const result = checkPublishReadiness({ giftCount: 3, eventDate: null, coverImageUrl: cover });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(['Elige la fecha de tu evento']);
  });

  it('blocks a registry with no cover image', () => {
    const result = checkPublishReadiness({ giftCount: 3, eventDate: future, coverImageUrl: null });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(['Agrega una imagen de portada']);
  });

  it('treats a blank cover url as no cover', () => {
    const result = checkPublishReadiness({ giftCount: 3, eventDate: future, coverImageUrl: '   ' });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(['Agrega una imagen de portada']);
  });

  it('treats a past date as unset — the placeholder was never changed', () => {
    const result = checkPublishReadiness({ giftCount: 3, eventDate: past, coverImageUrl: cover });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain('Elige la fecha de tu evento');
  });

  it('rejects an unparseable date rather than throwing', () => {
    const result = checkPublishReadiness({ giftCount: 3, eventDate: 'not-a-date', coverImageUrl: cover });
    expect(result.ready).toBe(false);
  });

  it('lists every gap, gifts first and the cover last', () => {
    const result = checkPublishReadiness({ giftCount: 0, eventDate: null });
    expect(result.missing).toEqual(['Agrega al menos un regalo', 'Elige la fecha de tu evento', 'Agrega una imagen de portada']);
  });

  it('accepts an ISO string date', () => {
    expect(checkPublishReadiness({ giftCount: 1, eventDate: future.toISOString(), coverImageUrl: cover }).ready).toBe(true);
  });
});
