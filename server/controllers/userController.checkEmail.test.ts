import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mock dependencies BEFORE importing the controller
vi.mock('../lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../services/passwordResetService.js', () => ({ default: {} }));
vi.mock('../services/emailService.js', () => ({ default: {} }));
vi.mock('../services/passwordValidationService.js', () => ({ default: {} }));
vi.mock('../services/discountCodeService.js', () => ({ discountCodeService: {} }));
vi.mock('../middleware/auth.js', () => ({
  createSessionAndSetCookie: vi.fn(),
  logoutSession: vi.fn(),
}));

import userController from './userController.js';
import prisma from '../lib/prisma.js';

const mockPrisma = prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } };

function mockReq(body: Record<string, unknown> = {}): Request {
  return { params: {}, query: {}, body } as unknown as Request;
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

describe('userController.checkEmailAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports a free email as available', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await userController.checkEmailAvailability(mockReq({ email: 'maria@correo.com' }), res);

    expect(res._json).toEqual({ available: true, email: 'maria@correo.com' });
  });

  it('normalizes case and whitespace before looking the email up', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 7 });
    const res = mockRes();

    await userController.checkEmailAvailability(mockReq({ email: '  Maria@Correo.com ' }), res);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'maria@correo.com' },
      select: { id: true },
    });
    expect(res._json).toEqual({ available: false, email: 'maria@correo.com' });
  });

  it('rejects a missing email', async () => {
    const res = mockRes();

    await userController.checkEmailAvailability(mockReq({}), res);

    expect(res._status).toBe(400);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
