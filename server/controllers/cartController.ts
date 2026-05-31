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
        include: { giftList: true },
      });

      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      if (gift.isPurchased) {
        return res.status(400).json({ error: 'Gift is already purchased' });
      }

      const giftListId = gift.giftListId;

      // Find or create cart
      let cart = await prisma.cart.findUnique({
        where: { sessionId: sessionId as string },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId: sessionId as string,
            giftListId,
          },
        });
      } else {
        // Don't append items to a cart that's already been paid — start a fresh cart instead.
        if (cart.status !== 'PENDING') {
          return res.status(409).json({ error: 'No se puede modificar un carrito que ya fue pagado' });
        }

        // Check if cart already has a giftListId and it's different
        if (cart.giftListId && cart.giftListId !== giftListId) {
          return res.status(400).json({
            error: 'Cannot add items from different gift lists to the same cart. Please complete your current purchase first.',
            currentGiftListId: cart.giftListId,
            attemptedGiftListId: giftListId,
          });
        }

        // Set giftListId if not set yet
        if (!cart.giftListId) {
          cart = await prisma.cart.update({
            where: { id: cart.id },
            data: { giftListId },
          });
        }
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

      const totalAmount = cartItems.reduce((sum: number, item: { price: number; quantity: number }) => {
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

      // Refuse to mutate a paid cart (see removeFromCart for context).
      const existing = await prisma.cartItem.findUnique({
        where: { id: Number(cartItemId) },
        include: { cart: { select: { status: true } } },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      if (existing.cart.status !== 'PENDING') {
        return res.status(409).json({ error: 'No se puede modificar un carrito que ya fue pagado' });
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
        include: { cart: { select: { status: true } } },
      });

      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      // Refuse to mutate a cart that has already been paid. Without this guard a late
      // `removeFromCart` (from another tab, a stale view, or the user returning to the
      // cart after PayPal redirect) would empty the cart, trigger the empty-cart branch
      // below, and nullify cart.giftListId — orphaning the payment from the analytics
      // report even though the payment + gift purchase records are correct.
      if (cartItem.cart.status !== 'PENDING') {
        return res.status(409).json({ error: 'No se puede modificar un carrito que ya fue pagado' });
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

      // If cart is now empty, clear the giftListId to allow items from other lists
      if (updatedCart && updatedCart.items.length === 0) {
        await prisma.cart.update({
          where: { id: updatedCart.id },
          data: {
            giftListId: null,
            totalAmount: 0,
          },
        });
        updatedCart.giftListId = null;
        updatedCart.totalAmount = 0;
      }

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
      const { sessionId, inviteeName, inviteeEmail, country, phoneNumber, message, rsvpCode }: UpdateCartDetailsRequest = req.body;

      if (!cartId) {
        return res.status(400).json({ error: 'Cart ID is required' });
      }

      // The sessionId from the request body must match the cart's stored sessionId.
      // Without this check, anyone with a cart ID could overwrite invitee info and
      // re-link the cart to an arbitrary RSVP code — distorting the rsvpInvitee join
      // the couple sees in the purchased-gifts view.
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const existingCart = await prisma.cart.findUnique({
        where: { id: Number(cartId) },
        select: { sessionId: true, status: true },
      });

      if (!existingCart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      if (existingCart.sessionId !== sessionId) {
        return res.status(403).json({ error: 'Session does not own this cart' });
      }

      // Don't allow rewriting invitee details on a paid cart — that would corrupt
      // the historical record the couple already saw in the purchased-gifts report.
      if (existingCart.status !== 'PENDING') {
        return res.status(409).json({ error: 'No se puede modificar un carrito que ya fue pagado' });
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
};
