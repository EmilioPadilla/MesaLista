import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
    const { title, description, price, imageUrl, imagePosition, categories, weddingListId, quantity, isMostWanted } = req.body as any;

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
          imagePosition: imagePosition ? Number(imagePosition) : 50,
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
    const { title, description, price, imageUrl, imagePosition, category, categories, quantity, isMostWanted } = req.body as any;

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
          ...(imagePosition !== undefined && { imagePosition: Number(imagePosition) }),
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
};

export default giftController;
