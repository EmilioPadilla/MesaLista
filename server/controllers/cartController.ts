import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AddToCartRequest, UpdateCartDetailsRequest, UpdateCartItemRequest, CartItem } from 'types/models/cart.js';

const prisma = new PrismaClient();

export default {
  // Create or get a cart based on sessionId
  getCart: async (req: Request, res: Response) => {
    try {
      let { sessionId } = req.query;

      // If no sessionId provided, create a new one
      if (!sessionId) {
        sessionId = uuidv4();
      }

      // Find existing cart or create a new one
      let cart = await prisma.cart.findUnique({
        where: { sessionId: sessionId as string },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId: sessionId as string,
          },
          include: {
            items: {
              include: {
                gift: true,
              },
            },
          },
        });
      }

      res.json(cart);
    } catch (error) {
      console.error('Error getting cart:', error);
      res.status(500).json({ error: 'Failed to get cart' });
    }
  },

  // Add a gift to the cart
  addToCart: async (req: Request, res: Response) => {
    try {
      const { giftId, quantity = 1, sessionId }: AddToCartRequest = req.body;

      if (!giftId) {
        return res.status(400).json({ error: 'Gift ID is required' });
      }

      // Check if the gift exists and is not purchased
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
      });

      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      if (gift.isPurchased) {
        return res.status(400).json({ error: 'Gift is already purchased' });
      }

      // Find or create cart
      let cart = await prisma.cart.findUnique({
        where: { sessionId: sessionId as string },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId: sessionId as string,
          },
        });
      }

      // Check if the item is already in the cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          giftId,
        },
      });

      let cartItem;

      if (existingCartItem) {
        // Update quantity if item exists
        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + quantity,
          },
          include: {
            gift: true,
          },
        });
      } else {
        // Create new cart item if it doesn't exist
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            giftId,
            quantity,
            price: gift.price, // Store the current price of the gift
          },
          include: {
            gift: true,
          },
        });
      }

      // If everything was successful, update the totalAmount in cart
      // Calculate total by summing the price * quantity for each cart item
      const cartItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: { gift: true },
      });

      const totalAmount = cartItems.reduce((sum: number, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          totalAmount,
        },
      });

      // Return the updated cart with all items
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      res.status(201).json(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req: Request, res: Response) => {
    try {
      const { id: cartItemId } = req.params;
      const { quantity }: UpdateCartItemRequest = req.body;

      if (!cartItemId) {
        return res.status(400).json({ error: 'Cart item ID is required' });
      }

      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Update cart item quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: Number(cartItemId) },
        data: { quantity },
        include: {
          gift: true,
        },
      });

      // Get the full cart with updated items
      const cart = await prisma.cart.findUnique({
        where: { id: updatedCartItem.cartId },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      res.json(cart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  },

  // Remove item from cart
  removeFromCart: async (req: Request, res: Response) => {
    try {
      const { id: cartItemId } = req.params;

      if (!cartItemId) {
        return res.status(400).json({ error: 'Cart item ID is required' });
      }

      // Find the cart item to get its cartId
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: Number(cartItemId) },
      });

      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      // Delete the cart item
      await prisma.cartItem.delete({
        where: { id: Number(cartItemId) },
      });

      // Get the updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cartItem.cartId },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      res.json(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },

  // Update cart details (invitee information and message)
  updateCartDetails: async (req: Request, res: Response) => {
    try {
      const { id: cartId } = req.params;
      const { inviteeName, inviteeEmail, country, phoneNumber, message, rsvpCode }: UpdateCartDetailsRequest = req.body;

      if (!cartId) {
        return res.status(400).json({ error: 'Cart ID is required' });
      }

      // Validate RSVP code if provided (only save if valid due to foreign key constraint)
      let validatedRsvpCode: string | null = null;
      if (rsvpCode && rsvpCode.trim()) {
        const invitee = await prisma.invitee.findUnique({
          where: { secretCode: rsvpCode.trim() },
        });
        
        // Only set the code if it exists (foreign key constraint requires it)
        if (invitee) {
          validatedRsvpCode = rsvpCode.trim();
        }
        // If invalid, we silently ignore it (frontend already warned the user)
      }

      // Update cart details
      const updatedCart = await prisma.cart.update({
        where: { id: Number(cartId) },
        data: {
          inviteeName,
          inviteeEmail,
          phoneNumber,
          message,
          country,
          rsvpCode: validatedRsvpCode,
        },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      res.json(updatedCart);
    } catch (error) {
      console.error('Error updating cart details:', error);
      res.status(500).json({ error: 'Failed to update cart details' });
    }
  },

  // Checkout cart - convert cart items to purchases
  checkoutCart: async (req: Request, res: Response) => {
    try {
      const { id: cartId } = req.params;

      if (!cartId) {
        return res.status(400).json({ error: 'Cart ID is required' });
      }

      // Get the cart with all items
      const cart = await prisma.cart.findUnique({
        where: { id: Number(cartId) },
        include: {
          items: {
            include: {
              gift: true,
            },
          },
        },
      });

      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Validate required fields
      if (!cart.inviteeName || !cart.inviteeEmail) {
        return res.status(400).json({
          error: 'Invitee name and email are required for checkout',
        });
      }

      // Start a transaction to ensure all operations succeed or fail together
      const result = await prisma.$transaction(async (tx: any) => {
        const purchaseIds: number[] = [];

        // Create a guest user or find by email
        let guestUser = await tx.user.findFirst({
          where: { email: cart.inviteeEmail || '' },
        });

        if (!guestUser) {
          // Split the invitee name into firstName and lastName
          const fullName = cart.inviteeName || 'Guest';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || 'Guest';
          const lastName = nameParts.slice(1).join(' ');

          guestUser = await tx.user.create({
            data: {
              firstName,
              lastName,
              email: cart.inviteeEmail || '',
              password: '', // No password for guest users
              role: 'GUEST',
              spouseFirstName: null,
              spouseLastName: null,
              imageUrl: null,
              phoneNumber: null,
              updatedAt: new Date(),
            },
          });
        }

        // Process each cart item
        for (const item of cart.items) {
          // Check if the gift is still available
          const gift = await tx.gift.findUnique({
            where: { id: item.giftId },
          });

          if (!gift || gift.isPurchased) {
            throw new Error(`Gift ${item.giftId} is no longer available`);
          }

          // Mark the gift as purchased
          await tx.gift.update({
            where: { id: item.giftId },
            data: { isPurchased: true },
          });
        }

        // Clear the cart after successful checkout
        await tx.cartItem.deleteMany({
          where: { cartId: Number(cartId) },
        });

        return purchaseIds;
      });

      res.status(200).json({
        success: true,
        purchaseIds: result,
        message: 'Checkout completed successfully',
      });
    } catch (error) {
      console.error('Error during checkout:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process checkout',
      });
    }
  },
};
