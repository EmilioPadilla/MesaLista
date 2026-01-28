import { Request, Response } from 'express';
import { predesignedListService } from '../services/predesignedListService.js';
import prisma from '../lib/prisma.js';

export const predesignedListController = {
  // ===================== Public ======================
  // Get all active predesigned lists with their gifts
  async getAllPredesignedLists(req: Request, res: Response) {
    try {
      const lists = await predesignedListService.getAllActiveLists();
      res.json(lists);
    } catch (error) {
      console.error('Error fetching predesigned lists:', error);
      res.status(500).json({ message: 'Error fetching predesigned lists' });
    }
  },

  // Get a single predesigned list by ID with its gifts
  async getPredesignedListById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      const list = await predesignedListService.getListById(parseInt(id));

      if (!list) {
        return res.status(404).json({ message: 'Predesigned list not found' });
      }

      res.json(list);
    } catch (error) {
      console.error('Error fetching predesigned list:', error);
      res.status(500).json({ message: 'Error fetching predesigned list' });
    }
  },

  // ===================== Protected ======================
  // Add a predesigned gift to user's wedding list (authenticated users)
  async addGiftToWeddingList(req: Request, res: Response) {
    try {
      const { giftId } = req.params;

      if (Array.isArray(giftId)) {
        return res.status(400).json({ message: 'Invalid gift ID' });
      }
      const { giftListId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!giftListId) {
        return res.status(400).json({ message: 'Gift list ID is required' });
      }

      // Get the predesigned gift
      const predesignedGift = await predesignedListService.getGiftById(parseInt(giftId));
      if (!predesignedGift) {
        return res.status(404).json({ message: 'Predesigned gift not found' });
      }

      // Create a new gift in the user's gift list based on the predesigned gift
      const newGift = await prisma.gift.create({
        data: {
          title: predesignedGift.title,
          description: predesignedGift.description,
          price: predesignedGift.price,
          imageUrl: predesignedGift.imageUrl,
          giftListId,
          isPurchased: false,
          isMostWanted: false,
          quantity: 0,
          order: 0,
        },
      });

      // Handle categories - create or find each category and link to gift
      if (predesignedGift.categories && predesignedGift.categories.length > 0) {
        for (const categoryName of predesignedGift.categories) {
          // Find or create the category
          const category = await prisma.giftCategory.upsert({
            where: { name: categoryName },
            update: {},
            create: { name: categoryName },
          });

          // Create the relationship between gift and category
          await prisma.giftCategoryOnGift.create({
            data: {
              giftId: newGift.id,
              categoryId: category.id,
              giftListId,
            },
          });
        }
      }

      res.status(201).json({ message: 'Gift added successfully', gift: newGift });
    } catch (error) {
      console.error('Error adding predesigned gift to wedding list:', error);
      res.status(500).json({ message: 'Error adding gift to wedding list' });
    }
  },

  // ===================== Admin ======================
  // Get all predesigned lists including inactive (admin only)
  async getAllPredesignedListsAdmin(req: Request, res: Response) {
    try {
      const lists = await predesignedListService.getAllLists();
      res.json(lists);
    } catch (error) {
      console.error('Error fetching all predesigned lists:', error);
      res.status(500).json({ message: 'Error fetching predesigned lists' });
    }
  },

  // Create a new predesigned list (admin only)
  async createPredesignedList(req: Request, res: Response) {
    try {
      const { name, description, imageUrl, icon, isActive } = req.body;

      if (!name || !description || !imageUrl || !icon) {
        return res.status(400).json({ message: 'Name, description, imageUrl, and icon are required' });
      }

      const list = await predesignedListService.createList({
        name,
        description,
        imageUrl,
        icon,
        isActive,
      });

      res.status(201).json(list);
    } catch (error) {
      console.error('Error creating predesigned list:', error);
      res.status(500).json({ message: 'Error creating predesigned list' });
    }
  },

  // Update a predesigned list (admin only)
  async updatePredesignedList(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      const { name, description, imageUrl, icon, isActive } = req.body;

      const list = await predesignedListService.updateList(parseInt(id), {
        name,
        description,
        imageUrl,
        icon,
        isActive,
      });

      res.json(list);
    } catch (error) {
      console.error('Error updating predesigned list:', error);
      res.status(500).json({ message: 'Error updating predesigned list' });
    }
  },

  // Delete a predesigned list (admin only)
  async deletePredesignedList(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      await predesignedListService.deleteList(parseInt(id));
      res.json({ message: 'Predesigned list deleted successfully' });
    } catch (error) {
      console.error('Error deleting predesigned list:', error);
      res.status(500).json({ message: 'Error deleting predesigned list' });
    }
  },

  // Reorder predesigned lists (admin only)
  async reorderPredesignedLists(req: Request, res: Response) {
    try {
      const { orders } = req.body;

      if (!Array.isArray(orders)) {
        return res.status(400).json({ message: 'Orders must be an array' });
      }

      await predesignedListService.reorderLists(orders);
      res.json({ message: 'Lists reordered successfully' });
    } catch (error) {
      console.error('Error reordering predesigned lists:', error);
      res.status(500).json({ message: 'Error reordering lists' });
    }
  },

  // Create a new predesigned gift (admin only)
  async createPredesignedGift(req: Request, res: Response) {
    try {
      const { listId } = req.params;

      if (Array.isArray(listId)) {
        return res.status(400).json({ message: 'Invalid list ID' });
      }
      const { title, description, price, imageUrl, categories, priority } = req.body;

      if (!title || !price || !imageUrl || !categories || !Array.isArray(categories) || categories.length === 0 || !priority) {
        return res.status(400).json({ message: 'Title, price, imageUrl, categories (array), and priority are required' });
      }

      const gift = await predesignedListService.createGift({
        title,
        description: description || null,
        price: parseFloat(price),
        imageUrl,
        categories,
        priority,
        predesignedListId: parseInt(listId),
      });

      res.status(201).json(gift);
    } catch (error) {
      console.error('Error creating predesigned gift:', error);
      res.status(500).json({ message: 'Error creating predesigned gift' });
    }
  },

  // Update a predesigned gift (admin only)
  async updatePredesignedGift(req: Request, res: Response) {
    try {
      const { giftId } = req.params;

      if (Array.isArray(giftId)) {
        return res.status(400).json({ message: 'Invalid gift ID' });
      }
      const { title, description, price, imageUrl, categories, priority } = req.body;

      const gift = await predesignedListService.updateGift(parseInt(giftId), {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        imageUrl,
        categories,
        priority,
      });

      res.json(gift);
    } catch (error) {
      console.error('Error updating predesigned gift:', error);
      res.status(500).json({ message: 'Error updating predesigned gift' });
    }
  },

  // Delete a predesigned gift (admin only)
  async deletePredesignedGift(req: Request, res: Response) {
    try {
      const { giftId } = req.params;

      if (Array.isArray(giftId)) {
        return res.status(400).json({ message: 'Invalid gift ID' });
      }
      await predesignedListService.deleteGift(parseInt(giftId));
      res.json({ message: 'Predesigned gift deleted successfully' });
    } catch (error) {
      console.error('Error deleting predesigned gift:', error);
      res.status(500).json({ message: 'Error deleting predesigned gift' });
    }
  },

  // Reorder predesigned gifts (admin only)
  async reorderPredesignedGifts(req: Request, res: Response) {
    try {
      const { orders } = req.body;

      if (!Array.isArray(orders)) {
        return res.status(400).json({ message: 'Orders must be an array' });
      }

      await predesignedListService.reorderGifts(orders);
      res.json({ message: 'Gifts reordered successfully' });
    } catch (error) {
      console.error('Error reordering predesigned gifts:', error);
      res.status(500).json({ message: 'Error reordering gifts' });
    }
  },
};
