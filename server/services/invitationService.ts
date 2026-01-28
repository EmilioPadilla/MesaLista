import { PrismaClient, InvitationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const invitationService = {
  /**
   * Get invitation by gift list ID
   */
  async getByGiftListId(giftListId: number) {
    return await prisma.invitation.findUnique({
      where: { giftListId },
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            coupleName: true,
            eventDate: true,
          },
        },
      },
    });
  },

  /**
   * Get invitation by ID
   */
  async getById(id: number) {
    return await prisma.invitation.findUnique({
      where: { id },
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            coupleName: true,
            eventDate: true,
          },
        },
      },
    });
  },

  /**
   * Create a new invitation
   */
  async create(data: {
    giftListId: number;
    templateId: string;
    eventName: string;
    htmlContent: string;
    formData: any;
    customColors?: any;
  }) {
    return await prisma.invitation.create({
      data: {
        giftListId: data.giftListId,
        templateId: data.templateId,
        eventName: data.eventName,
        htmlContent: data.htmlContent,
        formData: data.formData,
        customColors: data.customColors,
        status: InvitationStatus.DRAFT,
      },
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            coupleName: true,
            eventDate: true,
          },
        },
      },
    });
  },

  /**
   * Update an invitation
   */
  async update(
    id: number,
    data: {
      eventName?: string;
      htmlContent?: string;
      formData?: any;
      customColors?: any;
      status?: InvitationStatus;
    },
  ) {
    return await prisma.invitation.update({
      where: { id },
      data,
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            coupleName: true,
            eventDate: true,
          },
        },
      },
    });
  },

  /**
   * Publish an invitation
   */
  async publish(id: number) {
    return await prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            coupleName: true,
            eventDate: true,
          },
        },
      },
    });
  },

  /**
   * Increment view count
   */
  async incrementViewCount(id: number) {
    return await prisma.invitation.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Delete an invitation
   */
  async delete(id: number) {
    return await prisma.invitation.delete({
      where: { id },
    });
  },
};
