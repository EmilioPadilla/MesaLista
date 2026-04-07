import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma BEFORE importing the service so the module sees the mock
vi.mock('../lib/prisma.js', () => ({
  default: {
    invitee: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    rsvpCustomField: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rsvpCustomFieldResponse: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    // $queryRaw is a tagged template literal — mock as a function returning []
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(),
  },
}));

import prisma from '../lib/prisma.js';
import { rsvpService } from './rsvpService.js';

// Typed helpers
const mockPrisma = prisma as unknown as {
  invitee: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  rsvpCustomField: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  rsvpCustomFieldResponse: {
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  $queryRaw: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
};

const makeInvitee = (overrides = {}) => ({
  id: 'inv-1',
  giftListId: 10,
  firstName: 'Ana',
  lastName: 'López',
  tickets: 2,
  secretCode: 'ABC123',
  status: 'PENDING',
  confirmedTickets: null,
  guestMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  respondedAt: null,
  ...overrides,
});

const makeField = (overrides = {}) => ({
  id: 1,
  giftListId: 10,
  label: 'Restricciones alimentarias',
  type: 'TEXT' as const,
  required: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── respondToRsvp ─────────────────────────────────────────────────────────────

describe('rsvpService.respondToRsvp', () => {
  it('throws when invitee not found', async () => {
    // findUnique returns null → fallback to $queryRaw (legacy) which also returns [] → null → throw
    mockPrisma.invitee.findUnique.mockResolvedValue(null);
    mockPrisma.$queryRaw.mockResolvedValue([]); // no legacy match either

    await expect(rsvpService.respondToRsvp('BADCODE', 'CONFIRMED')).rejects.toThrow('Invitación no encontrada');
  });

  it('throws when confirmedTickets exceeds invitee.tickets', async () => {
    mockPrisma.invitee.findUnique.mockResolvedValue(makeInvitee({ tickets: 2 }));

    await expect(rsvpService.respondToRsvp('ABC123', 'CONFIRMED', 5)).rejects.toThrow('No puedes confirmar más de 2 boletos');
  });

  it('does NOT throw for confirmedTickets=0 (falsy guard skips validation, proceeds to tx)', async () => {
    // The service guard is `if (status === 'CONFIRMED' && confirmedTickets)` — 0 is falsy,
    // so the < 1 branch is never reached. The transaction runs instead.
    mockPrisma.invitee.findUnique.mockResolvedValue(makeInvitee({ tickets: 2 }));
    const updatedInvitee = makeInvitee({ status: 'CONFIRMED', confirmedTickets: 0 });
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      return fn({
        invitee: { update: vi.fn().mockResolvedValue(updatedInvitee) },
        rsvpCustomFieldResponse: { upsert: vi.fn() },
      });
    });

    const result = await rsvpService.respondToRsvp('ABC123', 'CONFIRMED', 0);
    expect(result).toBeDefined();
  });

  it('calls $transaction and updates invitee status', async () => {
    const invitee = makeInvitee();
    mockPrisma.invitee.findUnique.mockResolvedValue(invitee);

    const updatedInvitee = { ...invitee, status: 'CONFIRMED', confirmedTickets: 2 };
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        invitee: { update: vi.fn().mockResolvedValue(updatedInvitee) },
        rsvpCustomFieldResponse: { upsert: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await rsvpService.respondToRsvp('ABC123', 'CONFIRMED', 2, 'Nos vemos!');
    expect(result.status).toBe('CONFIRMED');
    expect(result.confirmedTickets).toBe(2);
  });

  it('upserts custom field responses inside transaction', async () => {
    const invitee = makeInvitee();
    mockPrisma.invitee.findUnique.mockResolvedValue(invitee);

    const upsertMock = vi.fn().mockResolvedValue({});
    const updatedInvitee = { ...invitee, status: 'CONFIRMED' };
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        invitee: { update: vi.fn().mockResolvedValue(updatedInvitee) },
        rsvpCustomFieldResponse: { upsert: upsertMock },
      };
      return fn(tx);
    });

    await rsvpService.respondToRsvp('ABC123', 'CONFIRMED', 1, undefined, [
      { fieldId: 1, value: 'vegetariano' },
      { fieldId: 2, value: 'true' },
    ]);

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { inviteeId_fieldId: { inviteeId: 'inv-1', fieldId: 1 } },
        create: { inviteeId: 'inv-1', fieldId: 1, value: 'vegetariano' },
        update: { value: 'vegetariano' },
      }),
    );
  });

  it('skips upsert when no customFieldResponses provided', async () => {
    const invitee = makeInvitee();
    mockPrisma.invitee.findUnique.mockResolvedValue(invitee);

    const upsertMock = vi.fn();
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        invitee: { update: vi.fn().mockResolvedValue(invitee) },
        rsvpCustomFieldResponse: { upsert: upsertMock },
      };
      return fn(tx);
    });

    await rsvpService.respondToRsvp('ABC123', 'CONFIRMED', 1);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('sets confirmedTickets to 0 for REJECTED status', async () => {
    const invitee = makeInvitee();
    mockPrisma.invitee.findUnique.mockResolvedValue(invitee);

    let capturedData: any;
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        invitee: {
          update: vi.fn().mockImplementation(({ data }: any) => {
            capturedData = data;
            return Promise.resolve({ ...invitee, ...data });
          }),
        },
        rsvpCustomFieldResponse: { upsert: vi.fn() },
      };
      return fn(tx);
    });

    await rsvpService.respondToRsvp('ABC123', 'REJECTED');
    expect(capturedData.confirmedTickets).toBe(0);
  });
});

// ─── getCustomFields ───────────────────────────────────────────────────────────

describe('rsvpService.getCustomFields', () => {
  it('returns fields ordered by order asc', async () => {
    const fields = [makeField({ order: 0 }), makeField({ id: 2, order: 1 })];
    mockPrisma.rsvpCustomField.findMany.mockResolvedValue(fields);

    const result = await rsvpService.getCustomFields(10);
    expect(result).toEqual(fields);
    expect(mockPrisma.rsvpCustomField.findMany).toHaveBeenCalledWith({
      where: { giftListId: 10 },
      orderBy: { order: 'asc' },
    });
  });

  it('returns empty array when no fields', async () => {
    mockPrisma.rsvpCustomField.findMany.mockResolvedValue([]);
    const result = await rsvpService.getCustomFields(99);
    expect(result).toEqual([]);
  });
});

// ─── createCustomField ─────────────────────────────────────────────────────────

describe('rsvpService.createCustomField', () => {
  it('creates a TEXT field with required=false by default', async () => {
    const created = makeField();
    mockPrisma.rsvpCustomField.create.mockResolvedValue(created);

    const result = await rsvpService.createCustomField(10, { label: 'Restricciones', type: 'TEXT' });
    expect(result).toEqual(created);
    expect(mockPrisma.rsvpCustomField.create).toHaveBeenCalledWith({
      data: {
        giftListId: 10,
        label: 'Restricciones',
        type: 'TEXT',
        required: false,
        order: 0,
      },
    });
  });

  it('creates a BOOLEAN required field', async () => {
    const created = makeField({ type: 'BOOLEAN', required: true });
    mockPrisma.rsvpCustomField.create.mockResolvedValue(created);

    await rsvpService.createCustomField(10, { label: 'Viene con pareja', type: 'BOOLEAN', required: true, order: 2 });
    expect(mockPrisma.rsvpCustomField.create).toHaveBeenCalledWith({
      data: { giftListId: 10, label: 'Viene con pareja', type: 'BOOLEAN', required: true, order: 2 },
    });
  });

  it('creates a NUMBER field', async () => {
    const created = makeField({ type: 'NUMBER' });
    mockPrisma.rsvpCustomField.create.mockResolvedValue(created);

    await rsvpService.createCustomField(10, { label: 'Cuántos niños', type: 'NUMBER' });
    expect(mockPrisma.rsvpCustomField.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'NUMBER' }),
    });
  });
});

// ─── updateCustomField ─────────────────────────────────────────────────────────

describe('rsvpService.updateCustomField', () => {
  it('updates label only', async () => {
    const updated = makeField({ label: 'Nuevo nombre' });
    mockPrisma.rsvpCustomField.update.mockResolvedValue(updated);

    const result = await rsvpService.updateCustomField(1, { label: 'Nuevo nombre' });
    expect(result).toEqual(updated);
    expect(mockPrisma.rsvpCustomField.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { label: 'Nuevo nombre' },
    });
  });

  it('updates required flag', async () => {
    mockPrisma.rsvpCustomField.update.mockResolvedValue(makeField({ required: true }));
    await rsvpService.updateCustomField(1, { required: true });
    expect(mockPrisma.rsvpCustomField.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { required: true },
    });
  });
});

// ─── deleteCustomField ─────────────────────────────────────────────────────────

describe('rsvpService.deleteCustomField', () => {
  it('deletes by id', async () => {
    mockPrisma.rsvpCustomField.delete.mockResolvedValue(makeField());
    await rsvpService.deleteCustomField(1);
    expect(mockPrisma.rsvpCustomField.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

// ─── getCustomFieldResponsesForInvitees ────────────────────────────────────────

describe('rsvpService.getCustomFieldResponsesForInvitees', () => {
  it('fetches responses filtered by giftListId via field relation', async () => {
    const responses = [{ id: 1, inviteeId: 'inv-1', fieldId: 1, value: 'veg', field: makeField() }];
    mockPrisma.rsvpCustomFieldResponse.findMany.mockResolvedValue(responses);

    const result = await rsvpService.getCustomFieldResponsesForInvitees(10);
    expect(result).toEqual(responses);
    expect(mockPrisma.rsvpCustomFieldResponse.findMany).toHaveBeenCalledWith({
      where: { field: { giftListId: 10 } },
      include: { field: true },
    });
  });
});
