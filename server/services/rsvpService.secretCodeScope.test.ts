import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma BEFORE importing the service so the module sees the mock
vi.mock('../lib/prisma.js', () => ({
  default: {
    invitee: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    // $queryRaw is a tagged template literal — mock as a function returning []
    $queryRaw: vi.fn().mockResolvedValue([]),
  },
}));

import prisma from '../lib/prisma.js';
import { rsvpService } from './rsvpService.js';

const mockPrisma = prisma as unknown as {
  invitee: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

const makeInvitee = (overrides = {}) => ({
  id: 'inv-1',
  giftListId: 10,
  firstName: 'Ana',
  lastName: 'López',
  tickets: 2,
  secretCode: 'ABC123',
  status: 'PENDING',
  confirmedTickets: 0,
  guestMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  respondedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$queryRaw.mockResolvedValue([]);
});

// These tests lock in the core behavior change: secret codes are unique *per gift
// list*, not globally. Every code lookup must be scoped to a giftListId.

describe('secret code uniqueness is scoped per gift list', () => {
  it('getInviteeBySecretCode looks up by the (giftListId, secretCode) composite key', async () => {
    mockPrisma.invitee.findUnique.mockResolvedValue(makeInvitee());

    await rsvpService.getInviteeBySecretCode(10, 'abc123');

    // Scoped to the gift list, and the code is normalized to upper case
    expect(mockPrisma.invitee.findUnique).toHaveBeenCalledWith({
      where: { giftListId_secretCode: { giftListId: 10, secretCode: 'ABC123' } },
    });
  });

  it('getInviteeBySecretCode returns null when the code only exists in another gift list', async () => {
    // The invitee lives in gift list 10, but we search gift list 99: the scoped
    // findUnique misses and the legacy fallback (also scoped) finds nothing.
    mockPrisma.invitee.findUnique.mockResolvedValue(null);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await rsvpService.getInviteeBySecretCode(99, 'ABC123');

    expect(result).toBeNull();
  });

  it('createInvitee allows the same secret code to be reused across different gift lists', async () => {
    // No invitee with this code exists *in gift list 20* → creation is allowed,
    // even if the same code is used in some other gift list.
    mockPrisma.invitee.findUnique.mockResolvedValue(null);
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.invitee.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-2', ...data }));

    const created = await rsvpService.createInvitee({ giftListId: 20, firstName: 'Bo', secretCode: 'shared' });

    // Duplicate check was scoped to gift list 20
    expect(mockPrisma.invitee.findUnique).toHaveBeenCalledWith({
      where: { giftListId_secretCode: { giftListId: 20, secretCode: 'SHARED' } },
    });
    // And the invitee was actually created with the normalized code
    expect(mockPrisma.invitee.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ giftListId: 20, secretCode: 'SHARED' }) }),
    );
    expect(created.secretCode).toBe('SHARED');
  });

  it('createInvitee rejects a duplicate secret code within the same gift list', async () => {
    // An invitee with this code already exists in the target gift list.
    mockPrisma.invitee.findUnique.mockResolvedValue(makeInvitee({ giftListId: 20, secretCode: 'SHARED' }));

    await expect(rsvpService.createInvitee({ giftListId: 20, firstName: 'Bo', secretCode: 'shared' })).rejects.toThrow(
      /ya existe/i,
    );
    expect(mockPrisma.invitee.create).not.toHaveBeenCalled();
  });

  it('generateSecretCode checks uniqueness scoped to the gift list', async () => {
    mockPrisma.invitee.findUnique.mockResolvedValue(null); // first generated code is free

    const code = await rsvpService.generateSecretCode(42);

    expect(code).toHaveLength(8);
    const call = mockPrisma.invitee.findUnique.mock.calls[0][0];
    expect(call.where.giftListId_secretCode.giftListId).toBe(42);
    expect(call.where.giftListId_secretCode.secretCode).toBe(code);
  });
});
