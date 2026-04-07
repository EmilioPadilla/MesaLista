import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mock dependencies BEFORE importing the controller
vi.mock('../services/rsvpService.js', () => ({
  rsvpService: {
    respondToRsvp: vi.fn(),
    getCustomFields: vi.fn(),
    createCustomField: vi.fn(),
    updateCustomField: vi.fn(),
    deleteCustomField: vi.fn(),
    getCustomFieldResponsesForInvitees: vi.fn(),
    getRsvpStats: vi.fn(),
  },
}));

vi.mock('../lib/prisma.js', () => ({
  default: {
    giftList: {
      findUnique: vi.fn(),
    },
  },
}));

import { rsvpController } from './rsvpController.js';
import { rsvpService } from '../services/rsvpService.js';
import prisma from '../lib/prisma.js';

const mockService = rsvpService as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockPrisma = prisma as unknown as { giftList: { findUnique: ReturnType<typeof vi.fn> } };

// ─── Test helpers ─────────────────────────────────────────────────────────────

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    user: { userId: 42 },
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response & { _status: number; _json: any } {
  const res: any = {};
  res._status = 200;
  res._json = undefined;
  res.status = vi.fn().mockImplementation((code: number) => {
    res._status = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((body: any) => {
    res._json = body;
    return res;
  });
  return res;
}

const makeField = (overrides = {}) => ({
  id: 1,
  giftListId: 10,
  label: 'Restricciones alimentarias',
  type: 'TEXT',
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

describe('rsvpController.respondToRsvp', () => {
  it('returns 400 when secretCode is missing', async () => {
    const req = mockReq({ params: { secretCode: '' }, body: { status: 'CONFIRMED' } });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);
    expect(res._status).toBe(400);
    expect(res._json.success).toBe(false);
  });

  it('returns 400 when status is missing', async () => {
    const req = mockReq({ params: { secretCode: 'ABC' }, body: {} });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 when status is invalid', async () => {
    const req = mockReq({ params: { secretCode: 'ABC' }, body: { status: 'MAYBE' } });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);
    expect(res._status).toBe(400);
    expect(res._json.message).toMatch(/inválido/i);
  });

  it('returns 200 with invitee on success', async () => {
    const invitee = { id: 'inv-1', secretCode: 'ABC123', status: 'CONFIRMED' };
    mockService.respondToRsvp.mockResolvedValue(invitee);

    const req = mockReq({
      params: { secretCode: 'ABC123' },
      body: { status: 'CONFIRMED', confirmedTickets: 2, guestMessage: 'Hola' },
    });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.data).toEqual(invitee);
    expect(mockService.respondToRsvp).toHaveBeenCalledWith(
      'ABC123', 'CONFIRMED', 2, 'Hola', undefined,
    );
  });

  it('forwards customFieldResponses to service', async () => {
    mockService.respondToRsvp.mockResolvedValue({ id: 'inv-1', secretCode: 'ABC123' });

    const cfr = [{ fieldId: 1, value: 'veg' }];
    const req = mockReq({
      params: { secretCode: 'ABC123' },
      body: { status: 'CONFIRMED', confirmedTickets: 1, customFieldResponses: cfr },
    });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);

    expect(mockService.respondToRsvp).toHaveBeenCalledWith(
      'ABC123', 'CONFIRMED', 1, undefined, cfr,
    );
  });

  it('returns 500 when service throws', async () => {
    mockService.respondToRsvp.mockRejectedValue(new Error('DB error'));

    const req = mockReq({
      params: { secretCode: 'ABC123' },
      body: { status: 'CONFIRMED', confirmedTickets: 1 },
    });
    const res = mockRes();
    await rsvpController.respondToRsvp(req, res);

    expect(res._status).toBe(500);
    expect(res._json.message).toBe('DB error');
  });
});

// ─── getCustomFields ───────────────────────────────────────────────────────────

describe('rsvpController.getCustomFields', () => {
  it('returns 400 when giftListId param is missing', async () => {
    const req = mockReq({ params: {} });
    const res = mockRes();
    await rsvpController.getCustomFields(req, res);
    expect(res._status).toBe(400);
  });

  it('returns fields for a given giftListId', async () => {
    const fields = [makeField()];
    mockService.getCustomFields.mockResolvedValue(fields);

    const req = mockReq({ params: { giftListId: '10' } });
    const res = mockRes();
    await rsvpController.getCustomFields(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.data).toEqual(fields);
    expect(mockService.getCustomFields).toHaveBeenCalledWith(10);
  });

  it('returns 500 on service error', async () => {
    mockService.getCustomFields.mockRejectedValue(new Error('fail'));
    const req = mockReq({ params: { giftListId: '10' } });
    const res = mockRes();
    await rsvpController.getCustomFields(req, res);
    expect(res._status).toBe(500);
  });
});

// ─── createCustomField ─────────────────────────────────────────────────────────

describe('rsvpController.createCustomField', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = mockReq({ user: undefined, body: {} } as any);
    const res = mockRes();
    await rsvpController.createCustomField(req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when required body fields missing', async () => {
    const req = mockReq({ body: { giftListId: 10 } }); // missing label, type
    const res = mockRes();
    await rsvpController.createCustomField(req, res);
    expect(res._status).toBe(400);
    expect(res._json.message).toMatch(/requeridos/i);
  });

  it('returns 400 for invalid type', async () => {
    const req = mockReq({ body: { giftListId: 10, label: 'X', type: 'DROPDOWN' } });
    const res = mockRes();
    await rsvpController.createCustomField(req, res);
    expect(res._status).toBe(400);
    expect(res._json.message).toMatch(/inválido/i);
  });

  it('returns 403 when user does not own the gift list', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ userId: 999 });
    const req = mockReq({ user: { userId: 42 } as any, body: { giftListId: 10, label: 'X', type: 'TEXT' } });
    const res = mockRes();
    await rsvpController.createCustomField(req, res);
    expect(res._status).toBe(403);
  });

  it('returns 201 with created field', async () => {
    mockPrisma.giftList.findUnique.mockResolvedValue({ userId: 42 });
    const field = makeField();
    mockService.createCustomField.mockResolvedValue(field);

    const req = mockReq({ body: { giftListId: 10, label: 'Restricciones', type: 'TEXT', required: false } });
    const res = mockRes();
    await rsvpController.createCustomField(req, res);

    expect(res._status).toBe(201);
    expect(res._json.success).toBe(true);
    expect(res._json.data).toEqual(field);
    expect(mockService.createCustomField).toHaveBeenCalledWith(10, {
      label: 'Restricciones',
      type: 'TEXT',
      required: false,
      order: undefined,
    });
  });
});

// ─── updateCustomField ─────────────────────────────────────────────────────────

describe('rsvpController.updateCustomField', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = mockReq({ user: undefined, params: { id: '1' }, body: {} } as any);
    const res = mockRes();
    await rsvpController.updateCustomField(req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 for invalid type in body', async () => {
    const req = mockReq({ params: { id: '1' }, body: { type: 'INVALID' } });
    const res = mockRes();
    await rsvpController.updateCustomField(req, res);
    expect(res._status).toBe(400);
  });

  it('returns updated field on success', async () => {
    const updated = makeField({ label: 'Nuevo' });
    mockService.updateCustomField.mockResolvedValue(updated);

    const req = mockReq({ params: { id: '1' }, body: { label: 'Nuevo' } });
    const res = mockRes();
    await rsvpController.updateCustomField(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.data).toEqual(updated);
    expect(mockService.updateCustomField).toHaveBeenCalledWith(1, {
      label: 'Nuevo',
      type: undefined,
      required: undefined,
      order: undefined,
    });
  });

  it('returns 500 on service error', async () => {
    mockService.updateCustomField.mockRejectedValue(new Error('not found'));
    const req = mockReq({ params: { id: '99' }, body: { label: 'X' } });
    const res = mockRes();
    await rsvpController.updateCustomField(req, res);
    expect(res._status).toBe(500);
    expect(res._json.message).toBe('not found');
  });
});

// ─── deleteCustomField ─────────────────────────────────────────────────────────

describe('rsvpController.deleteCustomField', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = mockReq({ user: undefined, params: { id: '1' } } as any);
    const res = mockRes();
    await rsvpController.deleteCustomField(req, res);
    expect(res._status).toBe(401);
  });

  it('returns success message on delete', async () => {
    mockService.deleteCustomField.mockResolvedValue(undefined);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await rsvpController.deleteCustomField(req, res);

    expect(res._json.success).toBe(true);
    expect(mockService.deleteCustomField).toHaveBeenCalledWith(1);
  });

  it('returns 500 on service error', async () => {
    mockService.deleteCustomField.mockRejectedValue(new Error('gone'));
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await rsvpController.deleteCustomField(req, res);
    expect(res._status).toBe(500);
  });
});

// ─── getCustomFieldResponses ───────────────────────────────────────────────────

describe('rsvpController.getCustomFieldResponses', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = mockReq({ user: undefined, query: { giftListId: '10' } } as any);
    const res = mockRes();
    await rsvpController.getCustomFieldResponses(req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when giftListId query param missing', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await rsvpController.getCustomFieldResponses(req, res);
    expect(res._status).toBe(400);
  });

  it('returns responses for gift list', async () => {
    const responses = [{ id: 1, inviteeId: 'inv-1', fieldId: 1, value: 'veg', field: makeField() }];
    mockService.getCustomFieldResponsesForInvitees.mockResolvedValue(responses);

    const req = mockReq({ query: { giftListId: '10' } });
    const res = mockRes();
    await rsvpController.getCustomFieldResponses(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.data).toEqual(responses);
    expect(mockService.getCustomFieldResponsesForInvitees).toHaveBeenCalledWith(10);
  });

  it('returns 500 on service error', async () => {
    mockService.getCustomFieldResponsesForInvitees.mockRejectedValue(new Error('db'));
    const req = mockReq({ query: { giftListId: '10' } });
    const res = mockRes();
    await rsvpController.getCustomFieldResponses(req, res);
    expect(res._status).toBe(500);
  });
});
