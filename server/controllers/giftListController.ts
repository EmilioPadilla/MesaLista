import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateGiftListRequest, GiftListBrief, UpdateGiftListRequest } from 'types/models/giftList.js';
import { WhereClause } from 'types/clauses.js';

const prisma = new PrismaClient();

const giftListController = {
  getAllGiftLists: async (_req: Request, res: Response) => {
    try {
      const giftLists = await prisma.giftList.findMany({
        where: {
          isActive: true,
          isPublic: true,
        },
        include: {
          gifts: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              email: true,
              slug: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          invitation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedGiftLists = giftLists.map(
        (list: any): GiftListBrief => ({
          id: list.id,
          coupleName: list.coupleName,
          eventDate: list.eventDate.toISOString(),
          imageUrl: list.imageUrl,
          eventLocation: list.eventLocation,
          eventVenue: list.eventVenue,
          description: list.description,
          totalGifts: list.gifts.length,
          purchasedGifts: list.gifts.filter((gift: any) => gift.isPurchased).length,
          userSlug: list.user.slug,
          invitationSlug: list.invitation?.status === 'PUBLISHED' ? `${list.user.slug}/${list.id}` : undefined,
        }),
      );

      res.json(formattedGiftLists);
    } catch (error) {
      console.error('Error fetching gift lists:', error);
      res.status(500).json({ error: 'Failed to fetch gift lists' });
    }
  },

  getGiftListsByUser: async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const giftLists = await prisma.giftList.findMany({
        where: { userId: Number(userId) },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const transformedLists = giftLists.map((list: any) => ({
        ...list,
        gifts: list.gifts.map((gift: any) => ({
          ...gift,
          categories: Array.isArray(gift.categories)
            ? gift.categories
                .map((catRel: any) =>
                  catRel.category && catRel.category.id && catRel.category.name
                    ? { id: catRel.category.id, name: catRel.category.name }
                    : null,
                )
                .filter(Boolean)
            : [],
        })),
      }));

      res.json(transformedLists);
    } catch (error) {
      console.error('Error fetching gift lists:', error);
      res.status(500).json({ error: 'Failed to fetch gift lists' });
    }
  },

  getGiftListById: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      const giftList = await prisma.giftList.findUnique({
        where: { id: Number(giftListId) },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!giftList) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const transformedGifts = giftList.gifts.map((gift: any) => ({
        ...gift,
        categories: Array.isArray(gift.categories)
          ? gift.categories
              .map((catRel: any) =>
                catRel.category && catRel.category.id && catRel.category.name
                  ? { id: catRel.category.id, name: catRel.category.name }
                  : null,
              )
              .filter(Boolean)
          : [],
      }));
      res.json({ ...giftList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching gift list:', error);
      res.status(500).json({ error: 'Failed to fetch gift list' });
    }
  },

  getFirstGiftListByUserSlug: async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug || Array.isArray(slug)) {
      return res.status(400).json({ error: 'User slug is required' });
    }

    try {
      // First, find the user by slug
      const user = await prisma.user.findUnique({
        where: { slug: slug as string },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the first gift list for this user (oldest created)
      const giftList = await prisma.giftList.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!giftList) {
        return res.status(404).json({ error: 'No gift lists found for this user' });
      }

      const transformedGifts = giftList.gifts.map((gift: any) => ({
        ...gift,
        categories: Array.isArray(gift.categories)
          ? gift.categories
              .map((catRel: any) =>
                catRel.category && catRel.category.id && catRel.category.name
                  ? { id: catRel.category.id, name: catRel.category.name }
                  : null,
              )
              .filter(Boolean)
          : [],
      }));
      res.json({ ...giftList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching first gift list by user slug:', error);
      res.status(500).json({ error: 'Failed to fetch gift list' });
    }
  },

  createGiftList: async (req: Request, res: Response) => {
    const { userId, title, description, coupleName, eventDate, imageUrl, planType, discountCodeId } = req.body as CreateGiftListRequest;

    if (!userId || !title || !coupleName || !eventDate) {
      return res.status(400).json({ error: 'User ID, title, couple name, and event date are required' });
    }

    try {
      const giftList = await prisma.giftList.create({
        data: {
          userId: Number(userId),
          title,
          description,
          coupleName,
          eventDate: new Date(eventDate),
          imageUrl,
          planType,
          discountCodeId: discountCodeId ? Number(discountCodeId) : undefined,
        },
      });

      res.status(201).json(giftList);
    } catch (error: any) {
      console.error('Error creating gift list:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A gift list with this data already exists' });
      }

      res.status(500).json({ error: 'Failed to create gift list' });
    }
  },

  updateGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const {
      title,
      description,
      coupleName,
      eventDate,
      eventLocation,
      eventVenue,
      imageUrl,
      invitationCount,
      planType,
      isActive,
      isPublic,
      feePreference,
    } = req.body as UpdateGiftListRequest;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      const giftList = await prisma.giftList.update({
        where: { id: Number(giftListId) },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(coupleName && { coupleName }),
          ...(eventDate && { eventDate: new Date(eventDate) }),
          ...(eventLocation !== undefined && { eventLocation }),
          ...(eventVenue !== undefined && { eventVenue }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(invitationCount !== undefined && { invitationCount }),
          ...(planType !== undefined && { planType }),
          ...(isActive !== undefined && { isActive }),
          ...(isPublic !== undefined && { isPublic }),
          ...(feePreference !== undefined && { feePreference }),
        },
      });

      res.json(giftList);
    } catch (error: any) {
      console.error('Error updating gift list:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      res.status(500).json({ error: 'Failed to update gift list' });
    }
  },

  deleteGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      await prisma.giftList.delete({
        where: { id: Number(giftListId) },
      });

      res.json({ message: 'Gift list deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting gift list:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      res.status(500).json({ error: 'Failed to delete gift list' });
    }
  },

  getGiftsByGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const { category, minPrice, maxPrice, sortOrder } = req.query;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      const whereClause: WhereClause = {
        giftListId: Number(giftListId),
      };

      if (category) {
        whereClause.categories = {
          some: {
            category: {
              name: category.toString(),
            },
          },
        };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        if (minPrice !== undefined) {
          whereClause.price = {
            gte: Number(minPrice),
          };
        }

        if (maxPrice !== undefined) {
          whereClause.price = {
            lte: Number(maxPrice),
          };
        }
      }

      const priceOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const gifts = await prisma.gift.findMany({
        where: whereClause,
        include: {
          giftList: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ price: priceOrder }, { createdAt: 'asc' }],
      });

      const formattedGifts = gifts.map((gift: any) => ({
        ...gift,
        categories: gift.categories.map((cat: any) => cat.category.name),
      }));

      res.json(formattedGifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      res.status(500).json({ error: 'Failed to fetch gifts' });
    }
  },

  getCategoriesInGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      const categoriesOnGifts = await prisma.giftCategoryOnGift.findMany({
        where: { giftListId: Number(giftListId) },
        include: { category: true },
      });

      const categoryMap = new Map<number, string>();
      categoriesOnGifts.forEach((item: any) => {
        if (item.category) {
          categoryMap.set(item.category.id, item.category.name);
        }
      });

      const categories = Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  reorderGiftsInGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const { giftOrders } = req.body;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    if (!giftOrders || !Array.isArray(giftOrders)) {
      return res.status(400).json({ error: 'Gift orders array is required' });
    }

    try {
      // @ts-ignore
      await prisma.$transaction(async (tx) => {
        for (const { giftId, order } of giftOrders) {
          await tx.gift.update({
            where: {
              id: Number(giftId),
              giftListId: Number(giftListId),
            },
            data: {
              order: Number(order),
            },
          });
        }
      });

      res.json({ message: 'Gift order updated successfully' });
    } catch (error) {
      console.error('Error updating gift order:', error);
      res.status(500).json({ error: 'Failed to update gift order' });
    }
  },
};

export default giftListController;
