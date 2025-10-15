import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import axios from 'axios';
import emailService from '../services/emailService.js';

const prisma = new PrismaClient();

// Stripe API configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
// Use https://api-m.paypal.com for production
// Use https://api-m.sandbox.paypal.com for sandbox
const PAYPAL_BASE_URL = 'https://api-m.paypal.com';

// PayPal access token cache
let paypalAccessToken: string | null = null;
let tokenExpiry: number = 0;

// Get PayPal access token
const getPayPalAccessToken = async (): Promise<string> => {
  if (paypalAccessToken && Date.now() < tokenExpiry) {
    return paypalAccessToken;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(`${PAYPAL_BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  paypalAccessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // Refresh 1 minute early

  return paypalAccessToken!;
};

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
        locale: 'es-419',
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

          // Send payment confirmation emails
          try {
            await emailService.sendPaymentEmails(cartId);
          } catch (emailError) {
            console.error('Error sending payment emails:', emailError);
            // Don't fail the webhook if email sending fails
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

      const formattedPayments = payments.map((payment: any) => ({
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

  // Create PayPal order
  createPayPalOrder: async (req: Request, res: Response) => {
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

      // Calculate total amount
      const totalAmount = cart.items.reduce((sum: number, item: any) => {
        const price = item.price || item.gift.price;
        return sum + price * item.quantity;
      }, 0);

      // Create PayPal order
      const accessToken = await getPayPalAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'MXN',
              value: totalAmount.toFixed(2),
            },
            description: `Regalos para ${cart.inviteeName || 'la pareja'}`,
            custom_id: cartId.toString(),
          },
        ],
        application_context: {
          return_url: successUrl,
          cancel_url: cancelUrl,
          brand_name: 'MesaLista',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const orderResponse = await axios.post(`${PAYPAL_BASE_URL}/v2/checkout/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderResponse.status === 201) {
        const order = orderResponse.data;
        // Find the approval URL
        const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

        res.json({
          success: true,
          orderId: order.id,
          approvalUrl: approvalUrl,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create PayPal order',
        });
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create PayPal order',
      });
    }
  },

  // Handle payment cancellation (both Stripe and PayPal)
  handlePaymentCancellation: async (req: Request, res: Response) => {
    try {
      const { cartId, paymentMethod } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID is required',
        });
      }

      const parsedCartId = parseInt(cartId);
      if (isNaN(parsedCartId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart ID format',
        });
      }

      // Get cart to verify it exists
      const cart = await prisma.cart.findUnique({
        where: { id: parsedCartId },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      // Only update if cart is still pending (not already paid)
      if (cart.status === 'PENDING') {
        await prisma.cart.update({
          where: { id: parsedCartId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        console.log(`Payment cancelled for cart ${parsedCartId} via ${paymentMethod || 'unknown'}`);
      }

      res.json({
        success: true,
        message: 'Payment cancellation recorded',
        cartStatus: cart.status === 'PENDING' ? 'CANCELLED' : cart.status,
      });
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to handle payment cancellation',
      });
    }
  },

  // Capture PayPal payment
  capturePayPalPayment: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
        });
      }

      // Capture the payment
      const accessToken = await getPayPalAccessToken();

      const captureResponse = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (captureResponse.status === 201) {
        const captureResult = captureResponse.data;

        // Get cart ID from the order's custom_id
        const customId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
        const cartId = customId ? parseInt(customId) : null;

        if (!cartId) {
          return res.status(400).json({
            success: false,
            message: 'Cart ID not found in order',
          });
        }

        // Get cart information
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

        // Update cart status
        await prisma.cart.update({
          where: { id: cartId },
          data: {
            status: 'PAID',
            paymentId: captureResult.id,
          },
        });

        // Create payment record
        const captureDetails = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
        const amount = parseFloat(captureDetails?.amount?.value || '0');

        await prisma.payment.create({
          data: {
            cartId,
            paymentId: captureResult.id || '',
            amount: amount,
            currency: captureDetails?.amount?.currency_code || 'MXN',
            paymentType: 'PAYPAL',
            transactionFee: 0, // PayPal fees would be calculated separately
            status: 'PAID',
            metadata: JSON.stringify(captureResult),
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

        // Send payment confirmation emails
        try {
          await emailService.sendPaymentEmails(cartId);
        } catch (emailError) {
          console.error('Error sending payment emails:', emailError);
          // Don't fail the payment capture if email sending fails
        }

        res.json({
          success: true,
          cartId: cartId,
          paymentId: captureResult.id,
          message: 'Payment captured successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to capture PayPal payment',
        });
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture PayPal payment',
      });
    }
  },

  // Create Stripe checkout session for plan payment (signup)
  createPlanCheckoutSession: async (req: Request, res: Response) => {
    try {
      const { planType, email, successUrl, cancelUrl } = req.body;

      if (!planType || !email) {
        return res.status(400).json({
          success: false,
          message: 'Plan type and email are required',
        });
      }

      // Only fixed plan requires payment
      if (planType !== 'FIXED') {
        return res.status(400).json({
          success: false,
          message: 'Only fixed plan requires payment',
        });
      }

      // Create line item for plan payment
      const lineItems = [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Plan Fijo - MesaLista',
              description: 'Pago único para acceso completo a MesaLista sin comisiones por ventas',
            },
            unit_amount: 300000, // $3,000 MXN in cents
          },
          quantity: 1,
        },
      ];

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        metadata: {
          planType: 'FIXED',
          email: email,
          paymentFor: 'PLAN_SUBSCRIPTION',
        },
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating plan checkout session:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout session',
      });
    }
  },
};
