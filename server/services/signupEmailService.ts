import prisma from '../lib/prisma.js';

export const signupEmailService = {
  /**
   * Save an email from a signup attempt. Upserts to avoid duplicates.
   * If the email already exists, updates firstName/lastName/phone if provided.
   */
  async saveFromSignup(data: { email: string; firstName?: string; lastName?: string; phone?: string }) {
    const existing = await prisma.signupEmail.findUnique({ where: { email: data.email } });

    if (existing) {
      // Update with any new info, but don't overwrite source if already manual
      return prisma.signupEmail.update({
        where: { email: data.email },
        data: {
          firstName: data.firstName || existing.firstName,
          lastName: data.lastName || existing.lastName,
          phone: data.phone || existing.phone,
        },
      });
    }

    return prisma.signupEmail.create({
      data: {
        email: data.email,
        source: 'signup',
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
      },
    });
  },

  /**
   * Add an email manually (from admin).
   */
  async addManual(data: { email: string; firstName?: string; lastName?: string }) {
    const existing = await prisma.signupEmail.findUnique({ where: { email: data.email } });

    if (existing) {
      return { created: false, signupEmail: existing };
    }

    const signupEmail = await prisma.signupEmail.create({
      data: {
        email: data.email,
        source: 'manual',
        firstName: data.firstName || null,
        lastName: data.lastName || null,
      },
    });

    return { created: true, signupEmail };
  },

  /**
   * Get all signup emails, ordered by most recent first.
   */
  async getAll() {
    return prisma.signupEmail.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Delete a signup email by ID.
   */
  async deleteById(id: number) {
    return prisma.signupEmail.delete({ where: { id } });
  },

  /**
   * Mark an email as converted to user (when they complete signup).
   */
  async markAsConverted(email: string) {
    const existing = await prisma.signupEmail.findUnique({ where: { email } });
    if (existing) {
      return prisma.signupEmail.update({
        where: { email },
        data: { convertedToUser: true },
      });
    }
    return null;
  },
};
