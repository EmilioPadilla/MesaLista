import prisma from '../lib/prisma.js';

export const predesignedListService = {
  // Get all active predesigned lists with their gifts
  async getAllActiveLists() {
    return await prisma.predesignedList.findMany({
      where: {
        isActive: true,
      },
      include: {
        gifts: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  },

  // Get all predesigned lists (admin only)
  async getAllLists() {
    return await prisma.predesignedList.findMany({
      include: {
        gifts: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  },

  // Get a single predesigned list by ID
  async getListById(id: number) {
    return await prisma.predesignedList.findUnique({
      where: { id },
      include: {
        gifts: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  },

  // Create a new predesigned list
  async createList(data: {
    name: string;
    description: string;
    imageUrl: string;
    icon: string;
    isActive?: boolean;
  }) {
    // Get the highest order number
    const maxOrder = await prisma.predesignedList.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return await prisma.predesignedList.create({
      data: {
        ...data,
        order: (maxOrder?.order ?? 0) + 1,
        isActive: data.isActive ?? true,
      },
      include: {
        gifts: true,
      },
    });
  },

  // Update a predesigned list
  async updateList(
    id: number,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      icon?: string;
      isActive?: boolean;
    },
  ) {
    return await prisma.predesignedList.update({
      where: { id },
      data,
      include: {
        gifts: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  },

  // Delete a predesigned list
  async deleteList(id: number) {
    // Delete all gifts first
    await prisma.predesignedGift.deleteMany({
      where: { predesignedListId: id },
    });

    return await prisma.predesignedList.delete({
      where: { id },
    });
  },

  // Reorder predesigned lists
  async reorderLists(orders: Array<{ id: number; order: number }>) {
    const updates = orders.map(({ id, order }) =>
      prisma.predesignedList.update({
        where: { id },
        data: { order },
      }),
    );

    return await prisma.$transaction(updates);
  },

  // Get a single predesigned gift by ID
  async getGiftById(id: number) {
    return await prisma.predesignedGift.findUnique({
      where: { id },
    });
  },

  // Create a new predesigned gift
  async createGift(data: {
    title: string;
    description: string | null;
    price: number;
    imageUrl: string;
    categories: string[];
    priority: string;
    predesignedListId: number;
  }) {
    // Get the highest order number for this list
    const maxOrder = await prisma.predesignedGift.findFirst({
      where: { predesignedListId: data.predesignedListId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return await prisma.predesignedGift.create({
      data: {
        ...data,
        order: (maxOrder?.order ?? 0) + 1,
      },
    });
  },

  // Update a predesigned gift
  async updateGift(
    id: number,
    data: {
      title?: string;
      description?: string | null;
      price?: number;
      imageUrl?: string;
      categories?: string[];
      priority?: string;
    },
  ) {
    return await prisma.predesignedGift.update({
      where: { id },
      data,
    });
  },

  // Delete a predesigned gift
  async deleteGift(id: number) {
    return await prisma.predesignedGift.delete({
      where: { id },
    });
  },

  // Reorder predesigned gifts
  async reorderGifts(orders: Array<{ id: number; order: number }>) {
    const updates = orders.map(({ id, order }) =>
      prisma.predesignedGift.update({
        where: { id },
        data: { order },
      }),
    );

    return await prisma.$transaction(updates);
  },
};
