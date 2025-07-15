import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  FormattedWeddingList,
  WeddingListWithGifts,
  GiftWithWeddingList,
  CreateGiftRequest,
  UpdateGiftRequest,
  CreateWeddingListRequest,
  PurchaseGiftRequest,
  UpdatePurchaseStatusRequest,
  GiftPurchaseWithRelations,
  FormattedPurchase,
  UserPurchase,
  PurchasedGiftsResponse,
  UserPurchasesResponse,
  PurchaseGiftResponse
} from '../types';

const prisma = new PrismaClient();

export const giftController = {
  // Get all wedding lists
  getAllWeddingLists: async (_req: Request, res: Response) => {
    try {
      const weddingLists = await prisma.weddingList.findMany({
        include: {
          gifts: true,
          couple: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      const formattedWeddingLists = weddingLists.map((list: WeddingListWithGifts): FormattedWeddingList => ({
        id: list.id,
        coupleName: list.coupleName,
        weddingDate: list.weddingDate.toISOString(),
        imageUrl: list.imageUrl || 'https://via.placeholder.com/150',
        gifts: list.gifts.map((gift) => ({
          id: gift.id,
          title: gift.title,
          description: gift.description,
          price: gift.price,
          isPurchased: gift.isPurchased,
          weddingListId: gift.weddingListId,
          createdAt: gift.createdAt.toISOString(),
          updatedAt: gift.updatedAt.toISOString()
        }))
      }));
      
      res.json(formattedWeddingLists);
    } catch (error) {
      console.error('Error fetching wedding lists:', error);
      res.status(500).json({ error: 'Failed to fetch wedding lists' });
    }
  },

  // Get all gifts for a wedding list
  getGiftsByWeddingList: async (req: Request, res: Response) => {
    const { weddingListId } = req.params;
    
    if (!weddingListId) {
      return res.status(400).json({ error: 'Wedding list ID is required' });
    }
    
    try {
      const gifts = await prisma.gift.findMany({
        where: { 
          weddingListId: Number(weddingListId) 
        },
        include: {
          weddingList: true
        }
      });
      
      res.json(gifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      res.status(500).json({ error: 'Failed to fetch gifts' });
    }
  },

  // Get a single gift by ID
  getGiftById: async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }
    
    try {
      const gift = await prisma.gift.findUnique({
        where: { 
          id: Number(id) 
        },
        include: {
          weddingList: true
        }
      });
      
      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }
      
      res.json(gift);
    } catch (error) {
      console.error('Error fetching gift:', error);
      res.status(500).json({ error: 'Failed to fetch gift' });
    }
  },

  // Create a new gift
  createGift: async (req: Request, res: Response) => {
    const { title, description, price, imageUrl, category, weddingListId } = req.body as CreateGiftRequest;
    
    if (!title || !price || !weddingListId) {
      return res.status(400).json({ error: 'Title, price, and wedding list ID are required' });
    }
    
    try {
      const gift = await prisma.gift.create({
        data: {
          title,
          description,
          price: Number(price),
          imageUrl,
          category,
          weddingListId: Number(weddingListId)
        }
      });
      
      res.status(201).json(gift);
    } catch (error) {
      console.error('Error creating gift:', error);
      res.status(500).json({ error: 'Failed to create gift' });
    }
  },

  // Update a gift
  updateGift: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, price, imageUrl, category } = req.body as UpdateGiftRequest;
    
    if (!id) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }
    
    try {
      const gift = await prisma.gift.update({
        where: { id: Number(id) },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(price && { price: Number(price) }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(category !== undefined && { category })
        }
      });
      
      res.json(gift);
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
        where: { id: Number(id) }
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
          gifts: true
        }
      });
      
      if (!weddingList) {
        return res.status(404).json({ error: 'Wedding list not found' });
      }
      
      res.json(weddingList);
    } catch (error) {
      console.error('Error fetching wedding list:', error);
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
          imageUrl
        }
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
        where: { id: Number(giftId) }
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
            status: 'PENDING'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            gift: true
          }
        }),
        prisma.gift.update({
          where: { id: Number(giftId) },
          data: { isPurchased: true }
        })
      ]);
      
      const response: PurchaseGiftResponse = {
        purchase,
        gift: updatedGift
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
    const { status } = req.body as UpdatePurchaseStatusRequest;
    
    if (!purchaseId || !status) {
      return res.status(400).json({ error: 'Purchase ID and status are required' });
    }
    
    try {
      const updatedPurchase = await prisma.giftPurchase.update({
        where: { id: Number(purchaseId) },
        data: { status: status.toUpperCase() },
        include: {
          gift: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
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
        where: { coupleId: Number(coupleId) }
      });
      
      if (!weddingList) {
        return res.status(404).json({ error: 'Wedding list not found' });
      }
      
      // Then get all purchased gifts for that wedding list
      const purchases = await prisma.giftPurchase.findMany({
        where: {
          gift: {
            weddingListId: weddingList.id
          }
        },
        include: {
          gift: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      });
      
      // Format the response to match the expected structure in the frontend
      const formattedPurchases = purchases.map((purchase: GiftPurchaseWithRelations): FormattedPurchase => ({
        id: purchase.id,
        giftName: purchase.gift.title,
        price: purchase.gift.price,
        purchaseDate: purchase.purchaseDate.toISOString(),
        purchasedBy: {
          id: purchase.user.id,
          name: purchase.user.name || 'Anonymous',
          email: purchase.user.email
        },
        status: purchase.status.toLowerCase(),
        message: purchase.message
      }));
      
      // Calculate total amount
      const totalAmount = purchases.reduce((sum: number, purchase: any) => sum + purchase.gift.price, 0);
      
      const response: PurchasedGiftsResponse = {
        purchases: formattedPurchases,
        totalAmount,
        count: purchases.length
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
          gift: {
            include: {
              weddingList: {
                include: {
                  couple: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      });
      
      // Format the response
      const formattedPurchases = purchases.map((purchase): UserPurchase => ({
        id: purchase.id,
        giftName: purchase.gift.title,
        price: purchase.gift.price,
        purchaseDate: purchase.purchaseDate.toISOString(),
        couple: {
          id: purchase.gift.weddingList.couple.id,
          name: purchase.gift.weddingList.couple.name || 'Anonymous Couple',
          email: purchase.gift.weddingList.couple.email
        },
        status: purchase.status.toLowerCase(),
        message: purchase.message
      }));
      
      const response: UserPurchasesResponse = {
        purchases: formattedPurchases,
        count: purchases.length
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({ error: 'Failed to fetch user purchases' });
    }
  }
};

export default giftController;
