import { Request, Response } from 'express';
import { rsvpService } from '../services/rsvpService.js';

export const rsvpController = {
  // Get all invitees for a gift list
  getInvitees: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { giftListId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!giftListId) {
        return res.status(400).json({
          success: false,
          message: 'giftListId es requerido',
        });
      }

      const invitees = await rsvpService.getInviteesByGiftListId(Number(giftListId));

      res.json({
        success: true,
        data: invitees,
      });
    } catch (error) {
      console.error('Error getting invitees:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener invitados',
      });
    }
  },

  // Get invitee by secret code (public endpoint for guests)
  getInviteeByCode: async (req: Request, res: Response) => {
    try {
      const { secretCode } = req.params;

      if (Array.isArray(secretCode)) {
        return res.status(400).json({ message: 'Invalid secret code' });
      }

      if (!secretCode) {
        return res.status(400).json({
          success: false,
          message: 'Código secreto requerido',
        });
      }

      const invitee = await rsvpService.getInviteeBySecretCode(secretCode);

      if (!invitee) {
        return res.status(404).json({
          success: false,
          message: 'Invitación no encontrada',
        });
      }

      res.json({
        success: true,
        data: invitee,
      });
    } catch (error) {
      console.error('Error getting invitee by code:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al buscar invitación',
      });
    }
  },

  // Validate RSVP code (public endpoint for checkout validation)
  validateRsvpCode: async (req: Request, res: Response) => {
    try {
      const { secretCode } = req.params;

      if (!secretCode || Array.isArray(secretCode)) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Código secreto requerido',
        });
      }

      const invitee = await rsvpService.getInviteeBySecretCode(secretCode as string);

      res.json({
        success: true,
        valid: !!invitee,
        message: invitee ? 'Código válido' : 'Código no encontrado',
      });
    } catch (error) {
      console.error('Error validating RSVP code:', error);
      res.status(500).json({
        success: false,
        valid: false,
        message: error instanceof Error ? error.message : 'Error al validar código',
      });
    }
  },

  // Create a new invitee (supports partial data)
  createInvitee: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { giftListId, firstName, lastName, tickets, secretCode, guestMessage, status } = req.body;

      if (!giftListId) {
        return res.status(400).json({
          success: false,
          message: 'giftListId es requerido',
        });
      }

      // Validate status if provided
      if (status && !['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser PENDING, CONFIRMED o REJECTED',
        });
      }

      const invitee = await rsvpService.createInvitee({
        giftListId: Number(giftListId),
        firstName: firstName?.trim() || undefined,
        lastName: lastName?.trim() || undefined,
        tickets: tickets ? parseInt(tickets) : undefined,
        secretCode: secretCode?.trim()?.toUpperCase() || undefined,
        guestMessage: guestMessage?.trim() || undefined,
        status: status || undefined,
      });

      res.status(201).json({
        success: true,
        data: invitee,
        message: 'Invitado creado exitosamente',
      });
    } catch (error) {
      console.error('Error creating invitee:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear invitado',
      });
    }
  },

  // Bulk create invitees
  bulkCreateInvitees: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { giftListId, invitees } = req.body;

      if (!giftListId) {
        return res.status(400).json({
          success: false,
          message: 'giftListId es requerido',
        });
      }

      if (!Array.isArray(invitees) || invitees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de invitados',
        });
      }

      const result = await rsvpService.bulkCreateInvitees(Number(giftListId), invitees);

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.created.length} invitados creados exitosamente`,
      });
    } catch (error) {
      console.error('Error bulk creating invitees:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear invitados',
      });
    }
  },

  // Update an invitee
  updateInvitee: async (req: Request, res: Response) => {
    try {
      const coupleId = req.user?.userId;

      if (!coupleId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const { firstName, lastName, tickets, secretCode } = req.body;

      // Verify the invitee belongs to this couple
      const existing = await rsvpService.getInviteeById(id);
      if (!existing || existing.coupleId !== coupleId) {
        return res.status(404).json({
          success: false,
          message: 'Invitado no encontrado',
        });
      }

      const invitee = await rsvpService.updateInvitee(id, {
        firstName,
        lastName,
        tickets: tickets ? parseInt(tickets) : undefined,
        secretCode: secretCode ? secretCode.toUpperCase() : undefined,
      });

      res.json({
        success: true,
        data: invitee,
        message: 'Invitado actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating invitee:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar invitado',
      });
    }
  },

  // Delete an invitee
  deleteInvitee: async (req: Request, res: Response) => {
    try {
      const coupleId = req.user?.userId;

      if (!coupleId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      // Verify the invitee belongs to this couple
      const existing = await rsvpService.getInviteeById(id as string);
      if (!existing || existing.coupleId !== coupleId) {
        return res.status(404).json({
          success: false,
          message: 'Invitado no encontrado',
        });
      }

      await rsvpService.deleteInvitee(id as string);

      res.json({
        success: true,
        message: 'Invitado eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error deleting invitee:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar invitado',
      });
    }
  },

  // Bulk delete invitees
  bulkDeleteInvitees: async (req: Request, res: Response) => {
    try {
      const coupleId = req.user?.userId;

      if (!coupleId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      const result = await rsvpService.bulkDeleteInvitees(ids);

      res.json({
        success: true,
        data: result,
        message: `${result.count} invitado(s) eliminado(s) exitosamente`,
      });
    } catch (error) {
      console.error('Error bulk deleting invitees:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar invitados',
      });
    }
  },

  // Bulk update invitee status
  bulkUpdateInviteeStatus: async (req: Request, res: Response) => {
    try {
      const coupleId = req.user?.userId;

      if (!coupleId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      if (!status || !['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }

      const result = await rsvpService.bulkUpdateInviteeStatus(ids, status);

      res.json({
        success: true,
        data: result,
        message: `${result.count} invitado(s) actualizado(s) exitosamente`,
      });
    } catch (error) {
      console.error('Error bulk updating invitees:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar invitados',
      });
    }
  },

  // Respond to RSVP (public endpoint for guests)
  respondToRsvp: async (req: Request, res: Response) => {
    try {
      const { secretCode } = req.params;

      if (Array.isArray(secretCode)) {
        return res.status(400).json({ message: 'Invalid secret code' });
      }
      const { status, confirmedTickets, guestMessage } = req.body;

      if (!secretCode || !status) {
        return res.status(400).json({
          success: false,
          message: 'Código secreto y estado son requeridos',
        });
      }

      if (!['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }

      const invitee = await rsvpService.respondToRsvp(secretCode, status, confirmedTickets, guestMessage);

      res.json({
        success: true,
        data: invitee,
        message: 'Respuesta registrada exitosamente',
      });
    } catch (error) {
      console.error('Error responding to RSVP:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al registrar respuesta',
      });
    }
  },

  // Get RSVP statistics
  getRsvpStats: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { giftListId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!giftListId) {
        return res.status(400).json({
          success: false,
          message: 'giftListId es requerido',
        });
      }

      const stats = await rsvpService.getRsvpStats(Number(giftListId));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting RSVP stats:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas',
      });
    }
  },

  // Get RSVP messages for a couple (public for guests to see custom messages)
  getRsvpMessages: async (req: Request, res: Response) => {
    try {
      const { coupleId } = req.params;

      if (Array.isArray(coupleId)) {
        return res.status(400).json({ message: 'Invalid couple ID' });
      }

      if (!coupleId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pareja requerido',
        });
      }

      const messages = await rsvpService.getRsvpMessages(parseInt(coupleId));

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error('Error getting RSVP messages:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener mensajes',
      });
    }
  },

  // Update RSVP messages
  updateRsvpMessages: async (req: Request, res: Response) => {
    try {
      const coupleId = req.user?.userId;

      if (!coupleId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const { confirmationMessage, cancellationMessage } = req.body;

      const messages = await rsvpService.updateRsvpMessages(coupleId, {
        confirmationMessage,
        cancellationMessage,
      });

      res.json({
        success: true,
        data: messages,
        message: 'Mensajes actualizados exitosamente',
      });
    } catch (error) {
      console.error('Error updating RSVP messages:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar mensajes',
      });
    }
  },
};
