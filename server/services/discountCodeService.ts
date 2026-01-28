import prisma from '../lib/prisma.js';
import { DiscountType } from '@prisma/client';

export const discountCodeService = {
  // Get all discount codes (admin only)
  async getAllDiscountCodes() {
    return await prisma.discountCode.findMany({
      include: {
        _count: {
          select: { giftLists: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Get a single discount code by code string
  async getDiscountCodeByCode(code: string) {
    return await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: { giftLists: true },
        },
      },
    });
  },

  // Validate a discount code (check if it's active, not expired, and has usage left)
  async validateDiscountCode(code: string) {
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discountCode) {
      return { valid: false, error: 'Código de descuento no encontrado' };
    }

    if (!discountCode.isActive) {
      return { valid: false, error: 'Código de descuento inactivo' };
    }

    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
      return { valid: false, error: 'Código de descuento expirado' };
    }

    if (discountCode.usageCount >= discountCode.usageLimit) {
      return { valid: false, error: 'Código de descuento agotado' };
    }

    return { valid: true, discountCode };
  },

  // Create a new discount code (admin only)
  async createDiscountCode(data: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    usageLimit: number;
    expiresAt?: Date;
  }) {
    return await prisma.discountCode.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        usageLimit: data.usageLimit,
        expiresAt: data.expiresAt,
      },
    });
  },

  // Update a discount code (admin only)
  async updateDiscountCode(
    id: number,
    data: {
      code?: string;
      discountType?: DiscountType;
      discountValue?: number;
      usageLimit?: number;
      isActive?: boolean;
      expiresAt?: Date;
    },
  ) {
    return await prisma.discountCode.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.discountType && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    });
  },

  // Delete a discount code (admin only)
  async deleteDiscountCode(id: number) {
    return await prisma.discountCode.delete({
      where: { id },
    });
  },

  // Increment usage count when a discount code is used
  async incrementUsageCount(id: number) {
    return await prisma.discountCode.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  },

  // Get discount code statistics (admin only)
  async getDiscountCodeStats(id: number) {
    const discountCode = await prisma.discountCode.findUnique({
      where: { id },
      include: {
        giftLists: {
          select: {
            id: true,
            coupleName: true,
            userId: true,
          },
        },
      },
    });

    return discountCode;
  },
};
