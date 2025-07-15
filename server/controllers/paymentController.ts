import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentType, InitiatePaymentRequest, VerifyPaymentRequest } from '../../shared/types/index.js';
import axios from 'axios';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API = process.env.PAYPAL_MODE === 'production' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

// Stripe API configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Helper function to get PayPal access token
const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  console.log(auth);
  try {
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      data: 'grant_type=client_credentials',
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }
};

// Helper function to calculate cart total
const calculateCartTotal = async (cartId: number) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: { gift: true },
  });

  let total = 0;

  for (const item of cartItems) {
    // Use the stored price in cart item or fall back to gift price
    const price = item.price || item.gift.price;
    total += price * item.quantity;
  }

  return total;
};

export default {
  // Initiate payment process
  initiatePayment: async (req: Request, res: Response) => {
    try {
      const { cartId, paymentType, returnUrl, cancelUrl }: InitiatePaymentRequest = req.body;

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
      const totalAmount = await calculateCartTotal(cartId);

      // Update cart with total amount
      await prisma.cart.update({
        where: { id: cartId },
        data: {
          totalAmount,
          paymentType,
        },
      });

      // Process based on payment type
      if (paymentType === PaymentType.PAYPAL) {
        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Create PayPal order
        const response = await axios({
          method: 'post',
          url: `${PAYPAL_API}/v2/checkout/orders`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          data: {
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: totalAmount.toFixed(2),
                },
                description: `Wedding gifts purchase from RegalAmor`,
              },
            ],
            application_context: {
              return_url: returnUrl,
              cancel_url: cancelUrl,
              brand_name: 'RegalAmor',
              user_action: 'PAY_NOW',
              shipping_preference: 'NO_SHIPPING',
            },
          },
        });

        const { id: paymentId, links } = response.data;
        const approvalUrl = links.find((link: any) => link.rel === 'approve').href;

        // Update cart with payment ID
        await prisma.cart.update({
          where: { id: cartId },
          data: { paymentId },
        });

        return res.json({
          success: true,
          paymentId,
          approvalUrl,
          message: 'PayPal payment initiated',
        });
      } else if (paymentType === PaymentType.STRIPE) {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: cart.items.map((item) => {
            return {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: item.gift.title,
                  description: item.gift.description || undefined,
                  images: item.gift.imageUrl ? [item.gift.imageUrl] : undefined,
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
              },
              quantity: item.quantity,
            };
          }),
          mode: 'payment',
          success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          metadata: {
            cartId: cartId.toString(),
          },
        });

        // Update cart with payment ID (session ID)
        await prisma.cart.update({
          where: { id: cartId },
          data: { paymentId: session.id },
        });

        return res.json({
          success: true,
          paymentId: session.id,
          approvalUrl: session.url,
          message: 'Stripe payment initiated',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported payment type',
        });
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate payment',
      });
    }
  },

  // Verify and complete payment
  verifyPayment: async (req: Request, res: Response) => {
    try {
      const { paymentId, paymentType, payerId, token }: VerifyPaymentRequest = req.body;

      if (!paymentId || !paymentType) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID and payment type are required',
        });
      }

      // Find the cart by payment ID
      const cart = await prisma.cart.findFirst({
        where: { paymentId },
        include: { items: true },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found for this payment',
        });
      }

      // Process based on payment type
      if (paymentType === PaymentType.PAYPAL) {
        if (!payerId) {
          return res.status(400).json({
            success: false,
            message: 'PayPal payer ID is required',
          });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Capture the payment
        const response = await axios({
          method: 'post',
          url: `${PAYPAL_API}/v2/checkout/orders/${paymentId}/capture`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const captureData = response.data;

        if (captureData.status !== 'COMPLETED') {
          return res.status(400).json({
            success: false,
            message: `Payment not completed. Status: ${captureData.status}`,
          });
        }

        // Extract payment details
        const captureDetails = captureData.purchase_units[0].payments.captures[0];
        const transactionFee = captureDetails.seller_receivable_breakdown?.paypal_fee?.value || 0;
        const payerEmail = captureData.payer?.email_address;
        const payerName = `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim();

        // Create money bag record
        const moneyBag = await prisma.moneyBag.create({
          data: {
            cartId: cart.id,
            amount: parseFloat(captureDetails.amount.value),
            currency: captureDetails.amount.currency_code,
            paymentType: PaymentType.PAYPAL,
            paymentId,
            transactionFee: parseFloat(transactionFee),
            paymentStatus: captureData.status,
            payerEmail,
            payerName,
            metadata: JSON.stringify(captureData),
          },
        });

        // Update cart as paid
        await prisma.cart.update({
          where: { id: cart.id },
          data: {
            isPaid: true,
            paidAt: new Date(),
          },
        });

        return res.json({
          success: true,
          moneyBagId: moneyBag.id,
          cartId: cart.id,
          message: 'Payment verified and completed successfully',
        });
      } else if (paymentType === PaymentType.STRIPE) {
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Stripe session token is required',
          });
        }

        // Retrieve the session
        const session = await stripe.checkout.sessions.retrieve(paymentId);

        if (session.payment_status !== 'paid') {
          return res.status(400).json({
            success: false,
            message: `Payment not completed. Status: ${session.payment_status}`,
          });
        }

        // Get payment intent details
        if (!session.payment_intent) {
          return res.status(400).json({
            success: false,
            message: 'Payment intent not found in session',
          });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        const charge = paymentIntent.application_fee_amount;

        // Create money bag record
        const moneyBag = await prisma.moneyBag.create({
          data: {
            cartId: cart.id,
            amount: session.amount_total || 0, // Convert from cents
            currency: session.currency || 'MXN',
            paymentType: PaymentType.STRIPE,
            paymentId,
            transactionFee: charge || 0, // Convert from cents
            paymentStatus: 'COMPLETED',
            payerEmail: session.customer_details?.email,
            payerName: session.customer_details?.name,
            metadata: JSON.stringify(session),
          },
        });

        // Update cart as paid
        await prisma.cart.update({
          where: { id: cart.id },
          data: {
            isPaid: true,
            paidAt: new Date(),
          },
        });

        return res.json({
          success: true,
          moneyBagId: moneyBag.id,
          cartId: cart.id,
          message: 'Payment verified and completed successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported payment type',
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      });
    }
  },

  // Get payment summary
  getPaymentSummary: async (req: Request, res: Response) => {
    try {
      const { id: moneyBagId } = req.params;

      if (!moneyBagId) {
        return res.status(400).json({ error: 'Money bag ID is required' });
      }

      // Get money bag with cart and items
      const moneyBag = await prisma.moneyBag.findUnique({
        where: { id: Number(moneyBagId) },
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

      if (!moneyBag) {
        return res.status(404).json({ error: 'Payment record not found' });
      }

      // Format payment summary
      const summary = {
        totalAmount: moneyBag.amount,
        currency: moneyBag.currency,
        itemCount: moneyBag.cart.items.length,
        paymentStatus: moneyBag.paymentStatus,
        paymentDate: moneyBag.createdAt.toISOString(),
        paymentType: moneyBag.paymentType,
        transactionId: moneyBag.paymentId,
        payerName: moneyBag.payerName,
        payerEmail: moneyBag.payerEmail,
        transactionFee: moneyBag.transactionFee,
        items: moneyBag.cart.items.map((item) => ({
          id: item.id,
          title: item.gift.title,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
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
      const payments = await prisma.moneyBag.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          cart: {
            select: {
              inviteeName: true,
              inviteeEmail: true,
              isPaid: true,
              paidAt: true,
            },
          },
        },
      });

      const formattedPayments = payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: payment.paymentType,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.createdAt.toISOString(),
        inviteeName: payment.cart.inviteeName,
        inviteeEmail: payment.cart.inviteeEmail,
        isPaid: payment.cart.isPaid,
        paidAt: payment.cart.paidAt ? payment.cart.paidAt.toISOString() : null,
      }));

      res.json(formattedPayments);
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  },
};
