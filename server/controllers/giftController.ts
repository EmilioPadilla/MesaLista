import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PurchasedGiftsResponse, PurchaseGiftRequest, PurchaseGiftResponse, UserPurchasesResponse } from 'types/api/gift.js';
import { GiftPurchase, PurchaseStatus } from 'types/models/gift.js';

const prisma = new PrismaClient();

export const giftController = {
  // Get a single gift by ID
  getGiftById: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }

    try {
      const gift = await prisma.gift.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          weddingList: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      // Format gift to include category information
      const formattedGift = {
        ...gift,
        categories: gift.categories.map((cat: any) => cat.category.name),
      };

      res.json(formattedGift);
    } catch (error) {
      console.error('Error fetching gift:', error);
      res.status(500).json({ error: 'Failed to fetch gift' });
    }
  },

  // Create a new gift
  createGift: async (req: Request, res: Response) => {
    const { title, description, price, imageUrl, categories, weddingListId, quantity, isMostWanted } = req.body as any;

    if (!title || !price || !weddingListId) {
      return res.status(400).json({ error: 'Title, price, and wedding list ID are required' });
    }

    try {
      let categoryNames: string[] = [];
      if (categories && Array.isArray(categories)) {
        categoryNames = categories
          .slice(0, 3)
          .map((cat: any) => (typeof cat === 'object' && cat !== null && 'name' in cat ? cat.name : cat));
      }

      // Create the gift first
      const gift = await prisma.gift.create({
        data: {
          title,
          description,
          price: Number(price),
          imageUrl,
          quantity: quantity ? Number(quantity) : 1,
          isMostWanted: Boolean(isMostWanted),
          weddingListId: Number(weddingListId),
        },
      });

      // Handle categories if provided
      if (categoryNames.length > 0) {
        // Find or create categories
        const categoryPromises = categoryNames.map(async (categoryName) => {
          let giftCategory = await prisma.giftCategory.findUnique({
            where: { name: categoryName },
          });

          if (!giftCategory) {
            giftCategory = await prisma.giftCategory.create({
              data: { name: categoryName },
            });
          }

          return giftCategory;
        });

        const giftCategories = await Promise.all(categoryPromises);

        // Create the many-to-many relationships with weddingListId
        const categoryRelationPromises = giftCategories.map((giftCategory) =>
          prisma.giftCategoryOnGift.create({
            data: {
              giftId: gift.id,
              categoryId: giftCategory.id,
              weddingListId: gift.weddingListId,
            },
          }),
        );

        await Promise.all(categoryRelationPromises);
      }

      // Fetch the created gift with categories for response
      const createdGift = await prisma.gift.findUnique({
        where: { id: gift.id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      // Format response to include category information
      const formattedGift = {
        ...createdGift,
        categories: createdGift?.categories.map((cat: any) => cat.category.name) || [],
      };

      res.status(201).json(formattedGift);
    } catch (error) {
      console.error('Error creating gift:', error);
      res.status(500).json({ error: 'Failed to create gift' });
    }
  },

  // Update a gift
  updateGift: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, price, imageUrl, category, categories, quantity, isMostWanted } = req.body as any;

    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }

    try {
      // Update the gift basic information
      const gift = await prisma.gift.update({
        where: { id: Number(id) },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(price && { price: Number(price) }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(quantity && { quantity: Number(quantity) }),
          ...(isMostWanted !== undefined && { isMostWanted: Boolean(isMostWanted) }),
        },
      });

      // Handle categories if provided
      // Consistent category name extraction (limit 3, support objects or strings)
      let categoryNames: string[] = [];
      if (categories && Array.isArray(categories)) {
        categoryNames = categories
          .slice(0, 3)
          .map((cat: any) => (typeof cat === 'object' && cat !== null && 'name' in cat ? cat.name : cat));
      } else if (category && typeof category === 'string') {
        categoryNames = [category];
      }

      if (categoryNames.length > 0) {
        // Remove existing category relationships
        await prisma.giftCategoryOnGift.deleteMany({
          where: { giftId: Number(id) },
        });

        // Find or create categories
        const categoryPromises = categoryNames.map(async (categoryName) => {
          let giftCategory = await prisma.giftCategory.findUnique({
            where: { name: categoryName },
          });

          if (!giftCategory) {
            giftCategory = await prisma.giftCategory.create({
              data: { name: categoryName },
            });
          }

          return giftCategory;
        });

        const giftCategories = await Promise.all(categoryPromises);

        // Fetch the gift to get weddingListId
        const giftForWeddingList = await prisma.gift.findUnique({
          where: { id: Number(id) },
          select: { weddingListId: true },
        });
        const weddingListId = giftForWeddingList?.weddingListId;

        // Create new category relationships with weddingListId
        const categoryRelationPromises = giftCategories.map((giftCategory: any) =>
          prisma.giftCategoryOnGift.create({
            // @ts-ignore
            data: {
              giftId: Number(id),
              categoryId: giftCategory.id,
              weddingListId,
            },
          }),
        );

        await Promise.all(categoryRelationPromises);
      }

      // Fetch the updated gift with categories for response
      const updatedGift = await prisma.gift.findUnique({
        where: { id: Number(id) },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        } as any,
      });

      // Format response to include category information
      const formattedGift = {
        ...updatedGift,
        categories: (updatedGift as any)?.categories.map((cat: any) => cat.category.name) || [],
      };

      res.json(formattedGift);
    } catch (error: any) {
      console.error('Error updating gift:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'Gift not found' });
      }

      res.status(500).json({ error: 'Failed to update gift' });
    }
  },

  // Delete a gift
  deleteGift: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }

    try {
      await prisma.gift.delete({
        where: { id: Number(id) },
      });

      res.json({ message: 'Gift deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting gift:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'Gift not found' });
      }

      res.status(500).json({ error: 'Failed to delete gift' });
    }
  },

  // Purchase a gift
  purchaseGift: async (req: Request, res: Response) => {
    const { giftId } = req.params;
    const { message } = req.body as PurchaseGiftRequest;
    const userId = req.user?.userId; // Get userId from authenticated request

    if (!giftId || !userId) {
      return res.status(400).json({ error: 'Gift ID and user ID are required' });
    }

    try {
      // Check if gift exists and is not already purchased
      const gift = await prisma.gift.findUnique({
        where: { id: Number(giftId) },
      });

      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      if (gift.isPurchased) {
        return res.status(400).json({ error: 'Gift is already purchased' });
      }

      // Create the purchase record and update the gift
      const [purchase, updatedGift] = await prisma.$transaction([
        prisma.giftPurchase.create({
          data: {
            giftId: Number(giftId),
            userId: Number(userId),
            message,
            status: 'PENDING',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                spouseFirstName: true,
                spouseLastName: true,
                imageUrl: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            gift: true,
          },
        }),
        prisma.gift.update({
          where: { id: Number(giftId) },
          data: { isPurchased: true },
        }),
      ]);

      const response: PurchaseGiftResponse = {
        // @ts-ignore
        purchase,
        // @ts-ignore
        gift: updatedGift,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error purchasing gift:', error);
      res.status(500).json({ error: 'Failed to purchase gift' });
    }
  },

  // Update purchase status
  updatePurchaseStatus: async (req: Request, res: Response) => {
    const { purchaseId } = req.params;
    const { status } = req.body as GiftPurchase;

    if (!purchaseId || !status) {
      return res.status(400).json({ error: 'Purchase ID and status are required' });
    }

    try {
      const updatedPurchase = await prisma.giftPurchase.update({
        where: { id: Number(purchaseId) },
        data: { status: status.toUpperCase() as PurchaseStatus },
        include: {
          gift: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              email: true,
            },
          },
        },
      });

      res.json(updatedPurchase);
    } catch (error: any) {
      console.error('Error updating purchase status:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      res.status(500).json({ error: 'Failed to update purchase status' });
    }
  },

  // Get all purchased gifts for a couple
  getPurchasedGifts: async (req: Request, res: Response) => {
    const { coupleId } = req.params;

    if (!coupleId) {
      return res.status(400).json({ error: 'Couple ID is required' });
    }

    try {
      // First find the wedding list for the couple
      const weddingList = await prisma.weddingList.findUnique({
        where: { coupleId: Number(coupleId) },
      });

      if (!weddingList) {
        return res.status(404).json({ error: 'Wedding list not found' });
      }

      // Then get all purchased gifts for that wedding list
      const purchases = await prisma.giftPurchase.findMany({
        where: {
          gift: {
            weddingListId: weddingList.id,
          },
        },
        include: {
          gift: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              email: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          purchaseDate: 'desc',
        },
      });

      // Format the response to match the expected structure in the frontend
      const formattedPurchases = purchases.map(
        // @ts-ignore
        (purchase: GiftPurchaseWithRelations): FormattedPurchase => ({
          id: purchase.id,
          giftName: purchase.gift.title,
          // @ts-ignore
          categories: purchase.gift.categories.map((cat: any) => cat.category.name),
          price: purchase.gift.price,
          purchaseDate: purchase.purchaseDate.toISOString(),
          purchasedBy: {
            id: purchase.user.id,
            name: purchase.user.firstName + ' ' + purchase.user.lastName || 'Anonymous',
            email: purchase.user.email,
          },
          status: purchase.status,
          message: purchase.message,
        }),
      );

      // Calculate total amount
      const totalAmount = purchases.reduce((sum: number, purchase: any) => sum + purchase.gift.price, 0);

      const response: PurchasedGiftsResponse = {
        purchases: formattedPurchases,
        totalAmount,
        count: purchases.length,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching purchased gifts:', error);
      res.status(500).json({ error: 'Failed to fetch purchased gifts' });
    }
  },

  // Get all purchases made by a user
  getUserPurchases: async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const purchases = await prisma.giftPurchase.findMany({
        where: { userId: Number(userId) },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              email: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          gift: {
            include: {
              weddingList: {
                include: {
                  couple: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      spouseFirstName: true,
                      spouseLastName: true,
                      imageUrl: true,
                      email: true,
                      phoneNumber: true,
                      role: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          purchaseDate: 'desc',
        },
      });

      // Format the response
      const formattedPurchases = purchases.map(
        // @ts-ignore
        (purchase: GiftPurchaseWithRelations): UserPurchase => ({
          id: purchase.id,
          giftName: purchase.gift.title,
          price: purchase.gift.price,
          purchaseDate: purchase.purchaseDate.toISOString(),
          couple: {
            id: purchase.user.id,
            name: purchase.user.firstName + ' ' + purchase.user.lastName || 'Anonymous Couple',
            email: purchase.user.email,
          },
          status: purchase.status,
          message: purchase.message,
        }),
      );

      const response: UserPurchasesResponse = {
        purchases: formattedPurchases,
        count: purchases.length,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({ error: 'Failed to fetch user purchases' });
    }
  },
};

export default giftController;
