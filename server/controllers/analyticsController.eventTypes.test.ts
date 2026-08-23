import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S11 — the new funnel events must be accepted by the whitelist. Without
// this the clients' calls silently 400 and the draft -> publish rate, which is
// the whole point of the free-to-build flow, never gets recorded.

const logEvent = vi.fn();

vi.mock('../services/analyticsService.js', () => ({
  analyticsService: { logEvent, upsertSession: vi.fn(), endSession: vi.fn() },
  default: { logEvent, upsertSession: vi.fn(), endSession: vi.fn() },
}));

const analyticsController = (await import('./analyticsController.js')).default;

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  logEvent.mockResolvedValue(undefined);
});

describe('POST /analytics/events', () => {
  it.each(['REGISTRY_DRAFT_CREATED', 'REGISTRY_PUBLISHED'])('accepts %s', async (eventType) => {
    const res = makeRes();
    await analyticsController.logEvent({ body: { sessionId: 'sess-1', eventType } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType }));
  });

  it('still rejects an unknown event type', async () => {
    const res = makeRes();
    await analyticsController.logEvent({ body: { sessionId: 'sess-1', eventType: 'MADE_UP' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('keeps accepting the pre-existing types', async () => {
    const res = makeRes();
    await analyticsController.logEvent({ body: { sessionId: 'sess-1', eventType: 'REGISTRY_PURCHASE' } } as any, res as any);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });
});
