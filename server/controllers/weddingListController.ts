import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateWeddingListRequest, WeddingListBrief, UpdateWeddingListRequest } from 'types/models/weddingList.js';
import { WhereClause } from 'types/clauses.js';

const prisma = new PrismaClient();

const weddingListController = {
  getAllWeddingLists: async (_req: Request, res: Response) => {
    try {
      const weddingLists = await prisma.weddingList.findMany({
        include: {
          gifts: true,
          couple: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              email: true,
              coupleSlug: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedWeddingLists = weddingLists.map(
        (list: any): WeddingListBrief => ({
          id: list.id,
          coupleName: list.coupleName,
          weddingDate: list.weddingDate.toISOString(),
          imageUrl: list.imageUrl,
          weddingLocation: list.weddingLocation,
          weddingVenue: list.weddingVenue,
          coupleSlug: list.couple.coupleSlug,
          description: list.description,
          totalGifts: list.gifts.length,
          purchasedGifts: list.gifts.filter((gift: any) => gift.isPurchased).length,
        }),
      );

      res.json(formattedWeddingLists);
    } catch (error) {
      console.error('Error fetching wedding lists:', error);
      res.status(500).json({ error: 'Failed to fetch wedding lists' });
    }
  },

  // Get wedding list by couple ID
  getWeddingListByCouple: async (req: Request, res: Response) => {
    const { coupleId } = req.params;

    if (!coupleId) {
      return res.status(400).json({ error: 'Couple ID is required' });
    }

    try {
      const weddingList = await prisma.weddingList.findUnique({
        where: { coupleId: Number(coupleId) },
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

      if (!weddingList) {
        return res.status(404).json({ error: 'Wedding list not found' });
      }

      // Transform categories to only include {id, name}
      const transformedGifts = weddingList.gifts.map((gift: any) => ({
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
      res.json({ ...weddingList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching wedding list:', error);
      res.status(500).json({ error: 'Failed to fetch wedding list' });
    }
  },

  // Get wedding list by couple slug
  getWeddingListBySlug: async (req: Request, res: Response) => {
    const { coupleSlug } = req.params;

    if (!coupleSlug) {
      return res.status(400).json({ error: 'Couple slug is required' });
    }

    try {
      // First find the user by coupleSlug
      const user = await prisma.user.findUnique({
        where: { coupleSlug },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Couple not found' });
      }

      // Then find the wedding list by coupleId
      const weddingList = await prisma.weddingList.findUnique({
        where: { coupleId: user.id },
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

      if (!weddingList) {
        return res.status(404).json({ error: 'Wedding list not found' });
      }

      // Transform categories to only include {id, name}
      const transformedGifts = weddingList.gifts.map((gift: any) => ({
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
      res.json({ ...weddingList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching wedding list by slug:', error);
      res.status(500).json({ error: 'Failed to fetch wedding list' });
    }
  },

  // Create a wedding list
  createWeddingList: async (req: Request, res: Response) => {
    const { coupleId, title, description, coupleName, weddingDate, imageUrl } = req.body as CreateWeddingListRequest;

    if (!coupleId || !title || !coupleName || !weddingDate) {
      return res.status(400).json({ error: 'Couple ID, title, couple name, and wedding date are required' });
    }

    try {
      const weddingList = await prisma.weddingList.create({
        data: {
          coupleId: Number(coupleId),
          title,
          description,
          coupleName,
          weddingDate: new Date(weddingDate),
          imageUrl,
        },
      });

      res.status(201).json(weddingList);
    } catch (error: any) {
      console.error('Error creating wedding list:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A wedding list for this couple already exists' });
      }

      res.status(500).json({ error: 'Failed to create wedding list' });
    }
  },

  // Update a wedding list
  updateWeddingList: async (req: Request, res: Response) => {
    const { weddingListId } = req.params;
    const { title, description, coupleName, weddingDate, imageUrl, invitationCount } = req.body as UpdateWeddingListRequest;

    if (!weddingListId) {
      return res.status(400).json({ error: 'Wedding list ID is required' });
    }

    try {
      const weddingList = await prisma.weddingList.update({
        where: { id: Number(weddingListId) },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(coupleName && { coupleName }),
          ...(weddingDate && { weddingDate: new Date(weddingDate) }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(invitationCount !== undefined && { invitationCount }),
        },
      });

      res.json(weddingList);
    } catch (error: any) {
      console.error('Error updating wedding list:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'Wedding list not found' });
      }

      res.status(500).json({ error: 'Failed to update wedding list' });
    }
  },

  // Get all gifts for a wedding list with optional filtering and sorting
  getGiftsByWeddingList: async (req: Request, res: Response) => {
    const { weddingListId } = req.params;
    const { category, minPrice, maxPrice, sortOrder } = req.query;

    if (!weddingListId) {
      return res.status(400).json({ error: 'Wedding list ID is required' });
    }

    try {
      // Build the where clause with filters
      const whereClause: WhereClause = {
        weddingListId: Number(weddingListId),
      };

      // Add category filter if provided
      if (category) {
        whereClause.categories = {
          some: {
            category: {
              name: category.toString(),
            },
          },
        };
      }

      // Add price range filters if provided
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

      // Determine sort order (default to ascending if not specified)
      const priceOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const gifts = await prisma.gift.findMany({
        where: whereClause,
        include: {
          weddingList: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ price: priceOrder }, { createdAt: 'asc' }],
      });

      // Format gifts to include category information
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

  getCategoriesInWeddingList: async (req: Request, res: Response) => {
    const { weddingListId } = req.params;

    if (!weddingListId) {
      return res.status(400).json({ error: 'Wedding list ID is required' });
    }

    try {
      // Fetch unique categories directly from GiftCategoryOnGift using weddingListId
      const categoriesOnGifts = await prisma.giftCategoryOnGift.findMany({
        where: { weddingListId: Number(weddingListId) },
        include: { category: true },
      });

      // Use a Map to ensure uniqueness by category id
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

  reorderGiftsInWeddingList: async (req: Request, res: Response) => {
    const { weddingListId } = req.params;
    const { giftOrders } = req.body; // Array of { giftId: number, order: number }

    if (!weddingListId) {
      return res.status(400).json({ error: 'Wedding list ID is required' });
    }

    if (!giftOrders || !Array.isArray(giftOrders)) {
      return res.status(400).json({ error: 'Gift orders array is required' });
    }

    try {
      // Update each gift's order in a transaction
      // @ts-ignore
      await prisma.$transaction(async (tx) => {
        for (const { giftId, order } of giftOrders) {
          await tx.gift.update({
            where: {
              id: Number(giftId),
              weddingListId: Number(weddingListId), // Ensure gift belongs to this wedding list
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

export default weddingListController;
