/**
 * Whether a draft registry is ready to publish.
 *
 * Deliberately loose — one gift, a real event date and a cover image. The point
 * is to stop a couple publishing something a guest would find empty, not to
 * enforce a notion of "complete". Tighten it once the funnel shows where couples
 * actually stall.
 *
 * Pure and dependency-free so the mobile publish screen can share the exact same
 * rules (see mobile/src/features/publish/readiness.ts, kept in sync).
 */

export interface ReadinessInput {
  giftCount: number;
  eventDate?: string | Date | null;
  /** The list's `imageUrl` — the cover guests see at the top of the registry. */
  coverImageUrl?: string | null;
}

export interface ReadinessResult {
  ready: boolean;
  /** What is still missing, in the order the couple should fix it. Empty when ready. */
  missing: string[];
}

/** An event date in the past almost always means the placeholder was never changed. */
function hasUsableEventDate(eventDate?: string | Date | null): boolean {
  if (!eventDate) return false;
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

export function checkPublishReadiness({ giftCount, eventDate, coverImageUrl }: ReadinessInput): ReadinessResult {
  const missing: string[] = [];

  if (!giftCount || giftCount < 1) {
    missing.push('Agrega al menos un regalo');
  }

  if (!hasUsableEventDate(eventDate)) {
    missing.push('Elige la fecha de tu evento');
  }

  if (!coverImageUrl || !coverImageUrl.trim()) {
    missing.push('Agrega una imagen de portada');
  }

  return { ready: missing.length === 0, missing };
}
