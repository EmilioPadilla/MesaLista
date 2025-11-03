import { Request, Response } from 'express';
import { discountCodeService } from '../services/discountCodeService.js';
import { DiscountType } from '@prisma/client';

export const discountCodeController = {
  // ===================== Public ======================
  // Validate a discount code (used during signup)
  async validateDiscountCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ message: 'Código de descuento requerido' });
      }

      const result = await discountCodeService.validateDiscountCode(code);

      if (!result.valid) {
        return res.status(400).json({ message: result.error });
      }

      // Return discount code info without sensitive data
      res.json({
        id: result.discountCode!.id,
        code: result.discountCode!.code,
        discountType: result.discountCode!.discountType,
        discountValue: result.discountCode!.discountValue,
      });
    } catch (error) {
      console.error('Error validating discount code:', error);
      res.status(500).json({ message: 'Error validando código de descuento' });
    }
  },

  // ===================== Admin Only ======================
  // Get all discount codes
  async getAllDiscountCodes(req: Request, res: Response) {
    try {
      const discountCodes = await discountCodeService.getAllDiscountCodes();
      res.json(discountCodes);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      res.status(500).json({ message: 'Error fetching discount codes' });
    }
  },

  // Get discount code statistics
  async getDiscountCodeStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await discountCodeService.getDiscountCodeStats(parseInt(id));

      if (!stats) {
        return res.status(404).json({ message: 'Discount code not found' });
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching discount code stats:', error);
      res.status(500).json({ message: 'Error fetching discount code stats' });
    }
  },

  // Create a new discount code
  async createDiscountCode(req: Request, res: Response) {
    try {
      const { code, discountType, discountValue, usageLimit, expiresAt } = req.body;

      // Validation
      if (!code || !discountType || discountValue === undefined || !usageLimit) {
        return res.status(400).json({
          message: 'Código, tipo de descuento, valor y límite de uso son requeridos',
        });
      }

      // Validate discount type
      if (discountType !== 'PERCENTAGE' && discountType !== 'FIXED_AMOUNT') {
        return res.status(400).json({
          message: 'Tipo de descuento inválido. Debe ser PERCENTAGE o FIXED_AMOUNT',
        });
      }

      // Validate discount value
      if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({
          message: 'El porcentaje de descuento debe estar entre 0 y 100',
        });
      }

      if (discountValue < 0) {
        return res.status(400).json({
          message: 'El valor del descuento debe ser positivo',
        });
      }

      // Validate usage limit
      if (usageLimit < 1) {
        return res.status(400).json({
          message: 'El límite de uso debe ser al menos 1',
        });
      }

      const discountCode = await discountCodeService.createDiscountCode({
        code,
        discountType: discountType as DiscountType,
        discountValue: parseFloat(discountValue),
        usageLimit: parseInt(usageLimit),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.status(201).json(discountCode);
    } catch (error: unknown) {
      console.error('Error creating discount code:', error);

      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ message: 'El código de descuento ya existe' });
      }

      res.status(500).json({ message: 'Error creating discount code' });
    }
  },

  // Update a discount code
  async updateDiscountCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, discountType, discountValue, usageLimit, isActive, expiresAt } = req.body;

      // Validate discount type if provided
      if (discountType && discountType !== 'PERCENTAGE' && discountType !== 'FIXED_AMOUNT') {
        return res.status(400).json({
          message: 'Tipo de descuento inválido. Debe ser PERCENTAGE o FIXED_AMOUNT',
        });
      }

      // Validate discount value if provided
      if (discountValue !== undefined) {
        if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
          return res.status(400).json({
            message: 'El porcentaje de descuento debe estar entre 0 y 100',
          });
        }

        if (discountValue < 0) {
          return res.status(400).json({
            message: 'El valor del descuento debe ser positivo',
          });
        }
      }

      // Validate usage limit if provided
      if (usageLimit !== undefined && usageLimit < 1) {
        return res.status(400).json({
          message: 'El límite de uso debe ser al menos 1',
        });
      }

      const discountCode = await discountCodeService.updateDiscountCode(parseInt(id), {
        code,
        discountType: discountType as DiscountType | undefined,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        usageLimit: usageLimit !== undefined ? parseInt(usageLimit) : undefined,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.json(discountCode);
    } catch (error: unknown) {
      console.error('Error updating discount code:', error);

      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ message: 'El código de descuento ya existe' });
      }

      res.status(500).json({ message: 'Error updating discount code' });
    }
  },

  // Delete a discount code
  async deleteDiscountCode(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await discountCodeService.deleteDiscountCode(parseInt(id));

      res.json({ message: 'Discount code deleted successfully' });
    } catch (error) {
      console.error('Error deleting discount code:', error);
      res.status(500).json({ message: 'Error deleting discount code' });
    }
  },
};
