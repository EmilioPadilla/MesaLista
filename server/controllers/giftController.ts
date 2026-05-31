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
          giftList: true,
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
      // Type assertion for categories relation
      const giftWithCategories = gift as typeof gift & { categories: any[] };
      const formattedGift = {
        ...gift,
        categories: giftWithCategories.categories.map((cat: any) => cat.category.name),
      };

      res.json(formattedGift);
    } catch (error) {
      console.error('Error fetching gift:', error);
      res.status(500).json({ error: 'Failed to fetch gift' });
    }
  },

  // Create a new gift
  createGift: async (req: Request, res: Response) => {
    const { title, description, price, imageUrl, imagePosition, categories, giftListId, quantity, isMostWanted } = req.body as any;

    if (!title || !price || !giftListId) {
      return res.status(400).json({ error: 'Title, price, and gift list ID are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Owner check: refuse to add gifts to a list the caller doesn't own.
      const owned = await prisma.giftList.findFirst({
        where: { id: Number(giftListId), userId: req.user.userId },
        select: { id: true },
      });
      if (!owned) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

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
          giftListId: Number(giftListId),
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

        // Create the many-to-many relationships with giftListId
        const categoryRelationPromises = giftCategories.map((giftCategory) =>
          prisma.giftCategoryOnGift.create({
            data: {
              giftId: gift.id,
              categoryId: giftCategory.id,
              giftListId: gift.giftListId,
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
    const { title, description, price, imageUrl, imagePosition, imageScale, category, categories, quantity, isMostWanted } =
      req.body as any;

    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Treat empty string for imageUrl as an explicit removal so the couple can drop
      // the image without having to delete the gift outright.
      const normalizedImageUrl = imageUrl === '' ? null : imageUrl;

      // Owner-scoped update via `updateMany` so the ownership filter sits in the SQL
      // `where`. Prisma's `update` requires a unique where clause, so we use
      // `updateMany` and treat count === 0 as not-found / not-owned. One round-trip.
      const result = await prisma.gift.updateMany({
        where: { id: Number(id), giftList: { userId: req.user.userId } },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(price && { price: Number(price) }),
          ...(normalizedImageUrl !== undefined && { imageUrl: normalizedImageUrl }),
          ...(imagePosition !== undefined && { imagePosition: Number(imagePosition) }),
          ...(imageScale !== undefined && { imageScale: Number(imageScale) }),
          ...(quantity && { quantity: Number(quantity) }),
          ...(isMostWanted !== undefined && { isMostWanted: Boolean(isMostWanted) }),
        },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      // Categories are owner-replaced when the field is present in the payload — even
      // when the array is empty. Treating "field omitted" and "field set to []"
      // identically was the silent edit bug: a couple removing every tag from a gift
      // saw their change ignored. The presence of the key is the signal, not its length.
      const categoriesProvided = Array.isArray(categories) || (category !== undefined && category !== null);

      if (categoriesProvided) {
        let categoryNames: string[] = [];
        if (Array.isArray(categories)) {
          categoryNames = categories
            .slice(0, 3)
            .map((cat: any) => (typeof cat === 'object' && cat !== null && 'name' in cat ? cat.name : cat))
            .filter((name: any) => typeof name === 'string' && name.trim().length > 0);
        } else if (typeof category === 'string' && category.trim().length > 0) {
          categoryNames = [category];
        }

        // Always wipe existing relationships when categories are part of the payload;
        // this is what makes "clear all categories" actually take effect.
        await prisma.giftCategoryOnGift.deleteMany({
          where: { giftId: Number(id) },
        });

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

          // Fetch the gift to get giftListId
          const giftForGiftList = await prisma.gift.findUnique({
            where: { id: Number(id) },
            select: { giftListId: true },
          });

          if (!giftForGiftList) {
            return res.status(404).json({ error: 'Gift not found' });
          }

          // Create new category relationships with giftListId
          const categoryRelationPromises = giftCategories.map((giftCategory: any) =>
            prisma.giftCategoryOnGift.create({
              data: {
                giftId: Number(id),
                categoryId: giftCategory.id,
                giftListId: giftForGiftList.giftListId,
              },
            }),
          );

          await Promise.all(categoryRelationPromises);
        }
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

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Owner-scoped delete in one round-trip.
      const result = await prisma.gift.deleteMany({
        where: { id: Number(id), giftList: { userId: req.user.userId } },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      res.json({ message: 'Gift deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting gift:', error);
      res.status(500).json({ error: 'Failed to delete gift' });
    }
  },
};

export default giftController;
