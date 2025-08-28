import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Stripe API configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default {
  // Create Stripe checkout session
  createCheckoutSession: async (req: Request, res: Response) => {
    try {
      const { cartId, successUrl, cancelUrl } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID is required',
        });
      }

      // Get cart with items
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: { gift: true },
          },
        },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty',
        });
      }

      // Create line items for Stripe
      const lineItems = cart.items.map((item: any) => {
        const price = item.price || item.gift.price;
        return {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: item.gift.title,
              description: item.gift.description || '',
              images: item.gift.imageUrl ? [item.gift.imageUrl] : [],
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          cartId: cartId.toString(),
          guestName: cart.inviteeName || '',
          guestEmail: cart.inviteeEmail || '',
          guestPhone: cart.phoneNumber || '',
        },
        currency: 'mxn',
        customer_email: cart.inviteeEmail || undefined,
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout session',
      });
    }
  },

  // Handle Stripe webhook events
  handleStripePaymentIntent: async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;

    try {
      // req.body is already raw buffer when using express.raw middleware
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        try {
          // Get cart information from metadata
          if (!session.metadata?.cartId) {
            console.error('Missing metadata in checkout session');
            return res.status(400).json({ error: 'Missing metadata' });
          }

          const cartId = parseInt(session.metadata.cartId);

          // Update cart with payment information
          await prisma.cart.update({
            where: { id: cartId },
            data: {
              status: 'PAID',
              paymentId: session.payment_intent as string,
            },
          });

          // Create payment record
          await prisma.payment.create({
            data: {
              cartId,
              paymentId: session.payment_intent as string,
              amount: (session.amount_total || 0) / 100, // Convert from cents
              currency: session.currency || 'mxn',
              paymentType: 'STRIPE',
              transactionFee: 0, // Stripe fees would be calculated separately
              status: 'PAID',
              metadata: JSON.stringify(session.metadata), // Convert object to string
            },
          });

          // Get cart items and mark the corresponding gifts as purchased
          const cartItems = await prisma.cartItem.findMany({
            where: { cartId },
            select: { giftId: true },
          });

          const giftIds = cartItems.map((item: { giftId: number }) => item.giftId);

          // Update all gifts as purchased in a single query
          if (giftIds.length > 0) {
            await prisma.gift.updateMany({
              where: {
                id: { in: giftIds },
              },
              data: {
                isPurchased: true,
              },
            });
          }
        } catch (error) {
          console.error('Error processing webhook:', error);
          return res.status(500).json({ error: 'Failed to process payment' });
        }
        break;

      case 'checkout.session.expired':
        // Handle expired checkout session
        const expiredSession = event.data.object;

        if (!expiredSession.metadata?.cartId) {
          console.error('Missing cartId in expired session metadata');
          break;
        }

        const expiredOrderId = parseInt(expiredSession.metadata.cartId);

        try {
          await prisma.cart.update({
            where: { id: expiredOrderId },
            data: {
              status: 'CANCELLED' as any,
            },
          });
          console.log('Checkout session expired for order:', expiredOrderId);
        } catch (error) {
          console.error('Error handling expired session:', error);
        }
        break;

      // Handle additional event types
      case 'charge.succeeded':
        console.log('Charge succeeded event received:', event.id);
        // We don't need to do anything special here as the checkout.session.completed
        // event already handles the payment processing
        break;

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded event received:', event.id);
        // This event is also handled by checkout.session.completed
        break;

      case 'payment_intent.created':
        console.log('Payment intent created event received:', event.id);
        // This is an informational event that doesn't require action
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  },

  // Get payment summary
  getPaymentSummary: async (req: Request, res: Response) => {
    try {
      const { id: paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID is required' });
      }

      // Get money bag with cart and items
      const payment = await prisma.payment.findUnique({
        where: { id: Number(paymentId) },
        include: {
          cart: {
            include: {
              items: {
                include: { gift: true },
              },
            },
          },
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment record not found' });
      }

      // Format payment summary
      const summary = {
        totalAmount: payment.amount,
        currency: payment.currency,
        itemCount: payment.cart.items.length,
        paymentStatus: payment.status,
        paymentDate: payment.createdAt.toISOString(),
        paymentType: payment.paymentType,
        transactionId: payment.paymentId,
        transactionFee: payment.transactionFee,
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting payment summary:', error);
      res.status(500).json({ error: 'Failed to get payment summary' });
    }
  },

  // List all payments
  getAllPayments: async (_req: Request, res: Response) => {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          cart: {
            select: {
              inviteeName: true,
              inviteeEmail: true,
              status: true,
            },
          },
        },
      });

      const formattedPayments = payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: payment.paymentType,
        status: payment.status,
        paymentDate: payment.createdAt.toISOString(),
      }));

      res.json(formattedPayments);
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  },
};
