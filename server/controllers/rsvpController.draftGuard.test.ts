import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEST-S14 — RSVP is guest-facing, so a leaked secret code must not let anyone
// respond to (or validate against) a registry the couple hasn't published yet.

vi.mock('../services/rsvpService.js', () => ({
  rsvpService: {
    respondToRsvp: vi.fn(),
    getInviteeBySecretCode: vi.fn(),
  },
}));

vi.mock('../services/pushService.js', () => ({ default: { sendRsvpReceivedPush: vi.fn().mockResolvedValue(undefined) } }));

vi.mock('../lib/prisma.js', () => ({
  default: { giftList: { findUnique: vi.fn() } },
}));

const { rsvpController } = await import('./rsvpController.js');
const { rsvpService } = await import('../services/rsvpService.js');
const { default: prisma } = await import('../lib/prisma.js');

const mockService = rsvpService as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockPrisma = prisma as unknown as { giftList: { findUnique: ReturnType<typeof vi.fn> } };

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('respondToRsvp', () => {
  it('refuses to record a response against an unpublished draft', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ publishedAt: null });

    const res = makeRes();
    await rsvpController.respondToRsvp(
      { params: { secretCode: 'ABC123' }, body: { status: 'CONFIRMED', giftListId: 11 } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockService.respondToRsvp).not.toHaveBeenCalled();
  });

  it('records a response against a published registry', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ publishedAt: new Date('2026-08-01') });
    mockService.respondToRsvp.mockResolvedValue({ firstName: 'Ana', lastName: 'Ruiz', status: 'CONFIRMED', confirmedTickets: 2 });

    const res = makeRes();
    await rsvpController.respondToRsvp(
      { params: { secretCode: 'ABC123' }, body: { status: 'CONFIRMED', giftListId: 10 } } as any,
      res as any,
    );

    expect(mockService.respondToRsvp).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(404);
  });
});

describe('validateRsvpCode', () => {
  it('reports codes for a draft as invalid rather than opening the flow', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ publishedAt: null });

    const res = makeRes();
    await rsvpController.validateRsvpCode({ params: { secretCode: 'ABC123' }, query: { giftListId: '11' } } as any, res as any);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
    expect(mockService.getInviteeBySecretCode).not.toHaveBeenCalled();
  });

  it('validates normally for a published registry', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ publishedAt: new Date('2026-08-01') });
    mockService.getInviteeBySecretCode.mockResolvedValue({ id: 'inv-1' });

    const res = makeRes();
    await rsvpController.validateRsvpCode({ params: { secretCode: 'ABC123' }, query: { giftListId: '10' } } as any, res as any);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ valid: true }));
  });
});
