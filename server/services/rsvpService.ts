import { PrismaClient } from '@prisma/client';

type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

const prisma = new PrismaClient();

export const rsvpService = {
  // Get all invitees for a gift list
  async getInviteesByGiftListId(giftListId: number) {
    return prisma.invitee.findMany({
      where: { giftListId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get a single invitee by ID
  async getInviteeById(id: string) {
    return prisma.invitee.findUnique({
      where: { id },
    });
  },

  // Get invitee by secret code
  async getInviteeBySecretCode(secretCode: string) {
    return prisma.invitee.findUnique({
      where: { secretCode },
    });
  },

  // Generate a unique secret code
  async generateSecretCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const existing = await prisma.invitee.findUnique({
        where: { secretCode: code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('No se pudo generar un código único. Por favor, intenta de nuevo.');
  },

  // Create a new invitee (supports partial data)
  async createInvitee(data: {
    giftListId: number;
    firstName?: string;
    lastName?: string;
    tickets?: number;
    secretCode?: string;
    guestMessage?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  }) {
    // Auto-generate missing values
    const firstName = data.firstName || 'Invitado';
    const lastName = data.lastName || 'Sin Apellido';
    const tickets = data.tickets || 1;
    let secretCode = data.secretCode?.toUpperCase();

    // Generate secret code if not provided
    if (!secretCode) {
      secretCode = await this.generateSecretCode();
    } else {
      // Check if provided secret code already exists
      const existing = await prisma.invitee.findUnique({
        where: { secretCode },
      });

      if (existing) {
        throw new Error('El código secreto ya existe. Por favor, usa otro código.');
      }
    }

    // Set status and confirmedTickets based on provided status
    const status = data.status || 'PENDING';
    const confirmedTickets = status === 'CONFIRMED' ? tickets : 0;
    const respondedAt = status !== 'PENDING' ? new Date() : null;

    return prisma.invitee.create({
      data: {
        giftListId: data.giftListId,
        firstName,
        lastName,
        tickets,
        secretCode,
        guestMessage: data.guestMessage || null,
        status,
        confirmedTickets,
        respondedAt,
      },
    });
  },

  // Bulk create invitees (supports partial data)
  async bulkCreateInvitees(
    giftListId: number,
    invitees: Array<{
      firstName?: string;
      lastName?: string;
      tickets?: number;
      secretCode?: string;
      guestMessage?: string;
      status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
    }>,
  ) {
    const results = {
      created: [] as any[],
      errors: [] as any[],
    };

    for (const invitee of invitees) {
      try {
        const created = await this.createInvitee({
          giftListId,
          firstName: invitee.firstName,
          lastName: invitee.lastName,
          tickets: invitee.tickets,
          secretCode: invitee.secretCode,
          guestMessage: invitee.guestMessage,
          status: invitee.status,
        });
        results.created.push(created);
      } catch (error) {
        results.errors.push({
          invitee,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return results;
  },

  // Update an invitee
  async updateInvitee(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      tickets?: number;
      secretCode?: string;
    },
  ) {
    // If updating secret code, check if it already exists
    if (data.secretCode) {
      const existing = await prisma.invitee.findUnique({
        where: { secretCode: data.secretCode },
      });

      if (existing && existing.id !== id) {
        throw new Error('El código secreto ya existe. Por favor, usa otro código.');
      }
    }

    return prisma.invitee.update({
      where: { id },
      data,
    });
  },

  // Delete an invitee
  async deleteInvitee(id: string) {
    return prisma.invitee.delete({
      where: { id },
    });
  },

  // Bulk delete invitees
  async bulkDeleteInvitees(ids: string[]) {
    return prisma.invitee.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  },

  // Bulk update invitee status
  async bulkUpdateInviteeStatus(ids: string[], status: RsvpStatus) {
    // For bulk updates, we need to handle confirmedTickets properly
    // CONFIRMED: set confirmedTickets to tickets (max allowed)
    // REJECTED/PENDING: set confirmedTickets to 0

    if (status === 'CONFIRMED') {
      // For CONFIRMED status, we need to update each invitee individually
      // to set confirmedTickets = tickets
      const invitees = await prisma.invitee.findMany({
        where: { id: { in: ids } },
        select: { id: true, tickets: true },
      });

      await prisma.$transaction(
        invitees.map((invitee: { id: string; tickets: number }) =>
          prisma.invitee.update({
            where: { id: invitee.id },
            data: {
              status: 'CONFIRMED',
              confirmedTickets: invitee.tickets,
              respondedAt: new Date(),
            },
          }),
        ),
      );

      return { count: invitees.length };
    } else {
      // For REJECTED or PENDING, we can use updateMany
      return prisma.invitee.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          confirmedTickets: 0,
          respondedAt: new Date(),
        },
      });
    }
  },

  // Respond to RSVP
  async respondToRsvp(secretCode: string, status: RsvpStatus, confirmedTickets?: number, guestMessage?: string) {
    const invitee = await prisma.invitee.findUnique({
      where: { secretCode },
    });

    if (!invitee) {
      throw new Error('Invitación no encontrada');
    }

    // Validate confirmed tickets
    if (status === 'CONFIRMED' && confirmedTickets) {
      if (confirmedTickets > invitee.tickets) {
        throw new Error(`No puedes confirmar más de ${invitee.tickets} boletos`);
      }
      if (confirmedTickets < 1) {
        throw new Error('Debes confirmar al menos 1 boleto');
      }
    }

    return prisma.invitee.update({
      where: { secretCode },
      data: {
        status,
        confirmedTickets: status === 'CONFIRMED' ? confirmedTickets : 0,
        guestMessage: guestMessage || null,
        respondedAt: new Date(),
      },
    });
  },

  // Get RSVP statistics for a gift list
  async getRsvpStats(giftListId: number) {
    const invitees = await prisma.invitee.findMany({
      where: { giftListId },
    });

    const stats = {
      total: invitees.length,
      confirmed: invitees.filter((i: any) => i.status === 'CONFIRMED').length,
      rejected: invitees.filter((i: any) => i.status === 'REJECTED').length,
      pending: invitees.filter((i: any) => i.status === 'PENDING').length,
      totalTickets: invitees.reduce((sum: number, i: any) => sum + i.tickets, 0),
      confirmedTickets: invitees.reduce((sum: number, i: any) => sum + (i.confirmedTickets || 0), 0),
      pendingTickets: invitees.filter((i: any) => i.status === 'PENDING').reduce((sum: number, i: any) => sum + i.tickets, 0),
      rejectedTickets: invitees.filter((i: any) => i.status === 'REJECTED').reduce((sum: number, i: any) => sum + i.tickets, 0),
    };

    return stats;
  },

  // Get or create RSVP messages for a gift list
  async getRsvpMessages(giftListId: number) {
    let messages = await prisma.rsvpMessages.findUnique({
      where: { giftListId },
    });

    // Create default messages if they don't exist
    if (!messages) {
      messages = await prisma.rsvpMessages.create({
        data: {
          giftListId,
        },
      });
    }

    return messages;
  },

  // Update RSVP messages for a gift list
  async updateRsvpMessages(
    giftListId: number,
    data: {
      confirmationMessage?: string;
      cancellationMessage?: string;
    },
  ) {
    // Ensure messages exist first
    await this.getRsvpMessages(giftListId);

    return prisma.rsvpMessages.update({
      where: { giftListId },
      data,
    });
  },
};
