import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import axios from 'axios';
import bcrypt from 'bcrypt';
import emailService from '../services/emailService.js';
import pushService from '../services/pushService.js';
import { discountCodeService } from '../services/discountCodeService.js';
import { createSessionAndSetCookie } from '../middleware/auth.js';
import { reconcileStripeFee, reconcilePayPalFee, stripeMexicoGross, paypalMexicoGross } from '../lib/paymentFees.js';
import { publishGiftList as publishGiftListRecord } from '../services/giftListPublishService.js';

const prisma = new PrismaClient();

function buildStripeUrl(rawUrl: string) {
  const url = new URL(rawUrl);

  // Decode first to avoid double-encoding, then encode
  const decodedPathname = decodeURIComponent(url.pathname);
  const segments = decodedPathname.split('/').map((segment) => encodeURIComponent(segment));
  url.pathname = segments.join('/');

  return url.toString();
}

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

const getDefaultEventDate = () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

// Use the couple's chosen event date when it parses to a valid date, otherwise
// fall back to the default (six months out).
const resolveEventDate = (raw?: string | null): Date => {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return getDefaultEventDate();
};

// Run an email-sending function and stamp the outcome on the Payment row. Webhook
// handlers call this so a Postmark glitch is observable via Payment.emailDeliveryStatus
// (= 'FAILED') and retryable via server/scripts/retryFailedEmails.ts, instead of being
// swallowed by `console.error` and leaving the couple unaware of a purchase.
export const recordEmailDelivery = async (cartId: number, send: () => Promise<void>): Promise<void> => {
  const now = new Date();
  try {
    await send();
    await prisma.payment.updateMany({
      where: { cartId },
      data: {
        emailDeliveryStatus: 'SENT',
        emailDeliveryError: null,
        emailDeliveryAttempts: { increment: 1 },
        emailDeliveryLastAttemptAt: now,
      },
    });
  } catch (emailError) {
    console.error(`Error sending payment emails for cart ${cartId}:`, emailError);
    const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
    try {
      await prisma.payment.updateMany({
        where: { cartId },
        data: {
          emailDeliveryStatus: 'FAILED',
          emailDeliveryError: errorMessage.slice(0, 1000),
          emailDeliveryAttempts: { increment: 1 },
          emailDeliveryLastAttemptAt: now,
        },
      });
    } catch (persistError) {
      // If we can't even record the failure, log it loudly — but still don't throw,
      // since this runs inside a payment webhook handler.
      console.error('Failed to record email delivery failure on Payment:', persistError);
    }
  }
};

// Fire a gift-received push to the couple. Fully fire-and-forget: a push failure must
// never affect the payment webhook (unlike email, push has no retry/observability yet).
const sendGiftReceivedPush = (cartId: number): void => {
  pushService.sendGiftReceivedPush(cartId).catch((error) => {
    console.error(`Error sending gift-received push for cart ${cartId}:`, error);
  });
};

const buildCoupleName = (firstName: string, lastName: string, spouseFirstName?: string | null) => {
  return spouseFirstName ? `${firstName} y ${spouseFirstName}` : `${firstName} ${lastName}`;
};

/**
 * UPGRADE mode: the couple already has an account and a draft list, and this
 * payment publishes it on the fixed plan.
 *
 * Everything that makes the transition safe — atomicity, plan immutability,
 * discount redemption, the confirmation email — lives in the publish service, so
 * a webhook replay lands on ALREADY_PUBLISHED and changes nothing.
 */
const publishFixedPlanUpgradeFromMetadata = async ({
  metadata,
  amount,
  source,
}: {
  metadata: Stripe.Metadata;
  amount: number;
  source: string;
}) => {
  const userId = Number(metadata.userId);
  const giftListId = Number(metadata.giftListId);

  if (!userId || !giftListId || Number.isNaN(userId) || Number.isNaN(giftListId)) {
    console.error(`Missing userId/giftListId for fixed plan upgrade via ${source}`);
    return null;
  }

  console.log(`Processing fixed plan upgrade for list ${giftListId} via ${source}`);

  const result = await publishGiftListRecord({ giftListId, userId, planType: 'FIXED', amount });

  if (!result.ok && result.reason === 'NOT_FOUND') {
    console.error(`Fixed plan upgrade target not found or not owned by user ${userId}: list ${giftListId}`);
    return null;
  }

  // ALREADY_PUBLISHED is the expected outcome of a replay, not an error.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, spouseFirstName: true, spouseLastName: true, phoneNumber: true, slug: true, role: true },
  });

  if (!user) return null;

  const giftList = result.ok
    ? result.giftList
    : await prisma.giftList.findUnique({
        where: { id: giftListId },
        select: { id: true, title: true, coupleName: true, eventDate: true },
      });

  if (!giftList) return null;

  return { user, giftList, created: result.ok };
};

const provisionFixedPlanSignupFromMetadata = async ({
  metadata,
  amount,
  source,
}: {
  metadata?: Stripe.Metadata | null;
  amount: number;
  source: 'checkout.session.completed' | 'payment_intent.succeeded' | 'success_page_recovery';
}) => {
  // Current flow: the account and draft already exist, so publish rather than create.
  if (metadata?.paymentFor === 'PLAN_UPGRADE') {
    return publishFixedPlanUpgradeFromMetadata({ metadata, amount, source });
  }

  // Legacy flow: App Store builds <= 1.0.2 (18) pay before the account exists,
  // so the signup payload rides along in the payment metadata.
  if (metadata?.paymentFor !== 'PLAN_SUBSCRIPTION' || !metadata.email) {
    return null;
  }

  console.log(`Processing plan subscription payment via ${source}`);

  const discountCodeId = metadata.discountCodeId ? parseInt(metadata.discountCodeId) : undefined;

  let user = await prisma.user.findUnique({
    where: { email: metadata.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      spouseFirstName: true,
      spouseLastName: true,
      phoneNumber: true,
      slug: true,
      role: true,
    },
  });

  if (!user) {
    // No phone number check: it's optional data (App Store guideline 5.1.1(v)).
    if (!metadata.passwordHash || !metadata.firstName || !metadata.lastName || !metadata.slug) {
      console.error(`Missing signup metadata for fixed plan provisioning via ${source}`);
      return null;
    }

    try {
      user = await prisma.user.create({
        data: {
          email: metadata.email,
          firstName: metadata.firstName,
          lastName: metadata.lastName,
          spouseFirstName: metadata.spouseFirstName || '',
          spouseLastName: metadata.spouseLastName || '',
          password: metadata.passwordHash,
          phoneNumber: metadata.phoneNumber || null,
          role: 'COUPLE',
          slug: metadata.slug,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          phoneNumber: true,
          slug: true,
          role: true,
        },
      });

      if (discountCodeId) {
        try {
          await prisma.discountCode.update({
            where: { id: discountCodeId },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        } catch (discountError) {
          console.error('Error incrementing discount code usage count:', discountError);
        }
      }
    } catch (error: any) {
      if (error?.code === 'P2002') {
        user = await prisma.user.findUnique({
          where: { email: metadata.email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            spouseFirstName: true,
            spouseLastName: true,
            phoneNumber: true,
            slug: true,
            role: true,
          },
        });
      } else {
        throw error;
      }
    }
  }

  if (!user) {
    return null;
  }

  // Dedup on ANY list this user owns, not just a FIXED one. Scoping this to
  // `planType: 'FIXED'` used to be safe because a user reaching here had no
  // lists at all; now they may hold a draft or a commission list, and a
  // narrower check would happily create a second list beside it.
  const existingGiftList = await prisma.giftList.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      coupleName: true,
      eventDate: true,
      planType: true,
      publishedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingGiftList) {
    // A draft found here means an old client paid against an account that had
    // already signed up through the new flow. Publish it rather than duplicating.
    if (existingGiftList.planType === null) {
      console.log(`Legacy fixed-plan payment landed on draft list ${existingGiftList.id}; publishing it`);
      await publishGiftListRecord({ giftListId: existingGiftList.id, userId: user.id, planType: 'FIXED', amount });
      return { user, giftList: existingGiftList, created: true };
    }

    console.log('User already has a gift list, skipping creation (deduplication)');
    return { user, giftList: existingGiftList, created: false };
  }

  const coupleName = buildCoupleName(user.firstName, user.lastName, user.spouseFirstName);
  const createdList = await prisma.giftList.create({
    data: {
      userId: user.id,
      title: `Mesa de Regalos de ${coupleName}`,
      description: '',
      coupleName,
      eventDate: resolveEventDate(metadata.eventDate),
      planType: 'FIXED',
      // Legacy signups have no publish step — the payment is the publish.
      publishedAt: new Date(),
      isActive: true,
      invitationCount: 0,
      ...(discountCodeId && { discountCodeId }),
    },
    select: {
      id: true,
      title: true,
      coupleName: true,
      eventDate: true,
    },
  });

  console.log(`Gift list created successfully via ${source}:`, createdList.id);

  try {
    await emailService.sendGiftListCreationEmail({
      userId: user.id,
      giftListId: createdList.id,
      giftListTitle: createdList.title,
      coupleName,
      eventDate: createdList.eventDate,
      planType: 'FIXED',
      amount,
    });
  } catch (emailError) {
    console.error('Error sending gift list creation email:', emailError);
  }

  return { user, giftList: createdList, created: true };
};

/* ------------------------------- RevenueCat -------------------------------- */
// iOS fixed-plan purchases go through Apple IAP, brokered by RevenueCat. These
// mirror the Stripe plan flow: `prepare` stashes the signup, the purchase happens
// natively, then `complete` (or the webhook) provisions the account once the
// `fixed_plan` entitlement is confirmed server-side.
const REVENUECAT_SECRET_API_KEY = process.env.REVENUECAT_SECRET_API_KEY || '';
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET || '';
const REVENUECAT_ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID || 'fixed_plan';
// Face value of the fixed plan in MXN — used only for the confirmation email
// (Apple, not us, is the source of truth for the amount actually charged).
const FIXED_PLAN_AMOUNT_MXN = 2000;

// Ask RevenueCat's REST API whether this app user currently holds the fixed-plan
// entitlement. Never trust the client's word that a purchase succeeded — this is
// the server-side verification gate before we hand out an account.
const hasActiveFixedPlanEntitlement = async (appUserId: string): Promise<boolean> => {
  if (!REVENUECAT_SECRET_API_KEY) {
    console.error('REVENUECAT_SECRET_API_KEY is not configured');
    return false;
  }
  const { data } = await axios.get(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${REVENUECAT_SECRET_API_KEY}` } },
  );
  const entitlement = data?.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  if (!entitlement) return false;
  // Non-consumable / lifetime entitlements report `expires_date: null` (never
  // expires); a dated one must still be in the future to count as active.
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
};

// Shape a PendingPlanSignup row into the Stripe-metadata-like object that
// `provisionFixedPlanSignupFromMetadata` already knows how to consume, so both
// payment rails share one provisioning path. No discount: Apple IAP prices are
// fixed App Store tiers, so codes never apply on iOS.
const pendingSignupToMetadata = (pending: {
  userId: number | null;
  giftListId: number | null;
  email: string | null;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  phoneNumber: string | null;
  slug: string | null;
  eventDate: Date | null;
}): Stripe.Metadata => {
  // UPGRADE rows carry ids only — the account already exists.
  if (pending.userId && pending.giftListId) {
    return {
      paymentFor: 'PLAN_UPGRADE',
      planType: 'FIXED',
      userId: String(pending.userId),
      giftListId: String(pending.giftListId),
    };
  }

  return {
    paymentFor: 'PLAN_SUBSCRIPTION',
    email: pending.email || '',
    passwordHash: pending.passwordHash || '',
    firstName: pending.firstName || '',
    lastName: pending.lastName || '',
    spouseFirstName: pending.spouseFirstName || '',
    spouseLastName: pending.spouseLastName || '',
    phoneNumber: pending.phoneNumber || '',
    slug: pending.slug || '',
    ...(pending.eventDate && { eventDate: pending.eventDate.toISOString() }),
  };
};

/** Apply a validated discount to the fixed-plan price. Returns cents for Stripe. */
const applyDiscountToFixedPlan = (discount: { discountType: string; discountValue: number } | null): number => {
  if (!discount) return FIXED_PLAN_AMOUNT_MXN * 100;
  const discounted =
    discount.discountType === 'PERCENTAGE'
      ? FIXED_PLAN_AMOUNT_MXN - (FIXED_PLAN_AMOUNT_MXN * discount.discountValue) / 100
      : FIXED_PLAN_AMOUNT_MXN - discount.discountValue;
  return Math.max(0, Math.round(discounted * 100));
};

/**
 * Stripe checkout for publishing an existing draft on the fixed plan.
 *
 * Unlike the legacy signup session this carries no credentials — the couple is
 * already authenticated, so metadata only needs to say who is paying and which
 * list the payment publishes. The list is verified to be an unpublished draft
 * owned by the caller before Stripe is involved, so a couple can't pay twice for
 * a list that is already live.
 */
const createFixedPlanUpgradeSession = async (
  req: Request,
  res: Response,
  {
    userId,
    giftListId,
    successUrl,
    cancelUrl,
    discountCode,
  }: { userId: number; giftListId: number; successUrl: string; cancelUrl: string; discountCode?: string },
) => {
  const giftList = await prisma.giftList.findUnique({
    where: { id: giftListId },
    select: { id: true, userId: true, planType: true, publishedAt: true },
  });

  if (!giftList || giftList.userId !== userId) {
    return res.status(404).json({ success: false, message: 'Gift list not found' });
  }

  if (giftList.planType !== null || giftList.publishedAt !== null) {
    return res.status(409).json({ success: false, message: 'Esta mesa de regalos ya fue publicada' });
  }

  let validatedDiscountCode = null;
  if (discountCode) {
    const validation = await discountCodeService.validateDiscountCode(discountCode);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    validatedDiscountCode = validation.discountCode ?? null;
  }

  const finalAmount = applyDiscountToFixedPlan(validatedDiscountCode);

  // Attach the code to the draft now; the publish transaction redeems it once
  // payment settles, so an abandoned checkout leaves the code unused.
  if (validatedDiscountCode) {
    await prisma.giftList.update({
      where: { id: giftListId },
      data: { discountCodeId: validatedDiscountCode.id },
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Plan Fijo - MesaLista',
            description: validatedDiscountCode
              ? `Publica tu mesa de regalos sin comisiones por venta (Código: ${validatedDiscountCode.code})`
              : 'Publica tu mesa de regalos sin comisiones por venta',
          },
          unit_amount: finalAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      paymentFor: 'PLAN_UPGRADE',
      planType: 'FIXED',
      userId: String(userId),
      giftListId: String(giftListId),
      ...(validatedDiscountCode && {
        discountCodeId: validatedDiscountCode.id.toString(),
        discountCode: validatedDiscountCode.code,
      }),
    },
  });

  return res.json({ success: true, sessionId: session.id, url: session.url });
};

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

      // Get cart with items and gift list
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: { gift: true },
          },
          giftList: true,
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

      // An unpublished draft must never take a guest's money. The frontend hides
      // the registry, but that is UI — this is the control.
      if (cart.giftList && cart.giftList.publishedAt === null) {
        return res.status(409).json({
          success: false,
          message: 'Esta mesa de regalos todavía no está publicada',
        });
      }

      // Get fee preference from gift list (default to 'couple' if not set)
      const feePreference = cart.giftList?.feePreference || 'couple';

      // Create line items for Stripe. Gifts are always listed at face price;
      // when the guest pays fees, the gross-up is added as its own line item so
      // the Stripe total matches the subtotal + comisión shown in the app.
      const lineItems = cart.items.map((item: any) => {
        const price = item.price || item.gift.price;

        const productData: any = {
          name: item.gift.title,
        };

        // Only include images if URL exists and encode it properly
        if (item.gift.imageUrl) {
          try {
            productData.images = [buildStripeUrl(item.gift.imageUrl)];
          } catch (error) {
            // If URL encoding fails, skip the image
            console.warn('Failed to encode image URL:', item.gift.imageUrl);
          }
        }

        // Only include description if it's not empty
        if (item.gift.description && item.gift.description.trim() !== '') {
          productData.description = item.gift.description;
        }

        return {
          price_data: {
            currency: 'mxn',
            product_data: productData,
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });

      if (feePreference === 'guest') {
        const cartTotal = cart.items.reduce(
          (sum: number, item: any) => sum + (item.price || item.gift.price) * item.quantity,
          0,
        );
        const guestFee = stripeMexicoGross(cartTotal) - cartTotal;
        if (guestFee > 0) {
          lineItems.push({
            price_data: {
              currency: 'mxn',
              product_data: { name: 'Comisión por procesamiento' },
              unit_amount: Math.round(guestFee * 100),
            },
            quantity: 1,
          });
        }
      }

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
        console.log('checkout.session.completed event received:', event.id);

        try {
          // Check if this is a gift list creation payment
          if (session.metadata?.paymentFor === 'GIFT_LIST_CREATION') {
            const userId = parseInt(session.metadata.userId);
            const giftListData = JSON.parse(session.metadata.giftListData);
            const discountCodeId = session.metadata.discountCodeId ? parseInt(session.metadata.discountCodeId) : undefined;

            console.log('Processing gift list creation for user:', userId);
            console.log('Gift list data:', giftListData);

            // Create the gift list with FIXED plan type
            const createdList = await prisma.giftList.create({
              data: {
                userId: userId,
                title: giftListData.title,
                description: giftListData.description || '',
                coupleName: giftListData.coupleName,
                eventDate: new Date(giftListData.eventDate),
                planType: 'FIXED',
                isActive: true,
                invitationCount: 0,
                ...(discountCodeId && { discountCodeId }),
              },
            });

            console.log('Gift list created successfully after payment:', createdList.id);

            // Send confirmation email to user
            try {
              await emailService.sendGiftListCreationEmail({
                userId: userId,
                giftListId: createdList.id,
                giftListTitle: giftListData.title,
                coupleName: giftListData.coupleName,
                eventDate: new Date(giftListData.eventDate),
                planType: 'FIXED',
                amount: (session.amount_total || 0) / 100, // Convert from cents to MXN
              });
            } catch (emailError) {
              console.error('Error sending gift list creation email:', emailError);
              // Don't fail the webhook if email sending fails
            }
          } else if (session.metadata?.paymentFor === 'PLAN_SUBSCRIPTION' && session.metadata?.email) {
            await provisionFixedPlanSignupFromMetadata({
              metadata: session.metadata,
              amount: (session.amount_total || 0) / 100,
              source: 'checkout.session.completed',
            });
          } else if (session.metadata?.cartId) {
            // Handle regular cart payment
            const cartId = parseInt(session.metadata.cartId);

            // Update cart with payment information
            await prisma.cart.update({
              where: { id: cartId },
              data: {
                status: 'PAID',
                paymentId: session.payment_intent as string,
              },
            });

            // Fetch the real fee Stripe charged via the balance_transaction on the latest charge.
            // This is the source of truth — it includes international card surcharges, IVA, etc.
            const amountPaid = (session.amount_total || 0) / 100;
            let stripeFee = reconcileStripeFee(null);
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
                expand: ['latest_charge.balance_transaction'],
              });
              stripeFee = reconcileStripeFee(paymentIntent);
            } catch (feeError) {
              console.error('Error fetching Stripe balance_transaction for fee reconciliation:', feeError);
            }

            // Create payment record
            await prisma.payment.create({
              data: {
                cartId,
                paymentId: session.payment_intent as string,
                amount: amountPaid,
                currency: session.currency || 'mxn',
                paymentType: 'STRIPE',
                transactionFee: stripeFee.transactionFee,
                netAmount: stripeFee.netAmount,
                feeSource: stripeFee.feeSource,
                status: 'PAID',
                metadata: JSON.stringify(session.metadata),
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

            // Send payment confirmation emails. Postmark glitches must not 500 the
            // webhook (Stripe would retry the whole event), so we swallow + persist
            // the outcome on Payment.emailDeliveryStatus for the retry CLI to pick up.
            await recordEmailDelivery(cartId, () => emailService.sendPaymentEmails(cartId));
            sendGiftReceivedPush(cartId);
          } else {
            console.error('Missing metadata in checkout session');
            return res.status(400).json({ error: 'Missing metadata' });
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
        const paymentIntent = event.data.object;

        try {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1,
          });

          if (sessions.data.length > 0) {
            const checkoutSession = sessions.data[0];

            await provisionFixedPlanSignupFromMetadata({
              metadata: checkoutSession.metadata,
              amount: paymentIntent.amount / 100,
              source: 'payment_intent.succeeded',
            });
          }
        } catch (error) {
          console.error('Error processing payment_intent.succeeded:', error);
        }
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

  // List all payments — platform-wide view, restricted to admins.
  getAllPayments: async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
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

      // Get cart with items and gift list
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: { gift: true },
          },
          giftList: true,
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

      // An unpublished draft must never take a guest's money. The frontend hides
      // the registry, but that is UI — this is the control.
      if (cart.giftList && cart.giftList.publishedAt === null) {
        return res.status(409).json({
          success: false,
          message: 'Esta mesa de regalos todavía no está publicada',
        });
      }

      // Get fee preference from gift list (default to 'couple' if not set)
      const feePreference = cart.giftList?.feePreference || 'couple';

      // Calculate total amount
      let totalAmount = cart.items.reduce((sum: number, item: any) => {
        const price = item.price || item.gift.price;
        return sum + price * item.quantity;
      }, 0);

      // If guest pays fees, gross up the total (same formula the app displays)
      if (feePreference === 'guest') {
        totalAmount = paypalMexicoGross(totalAmount);
      }

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
        const paypalFee = reconcilePayPalFee(captureDetails);

        await prisma.payment.create({
          data: {
            cartId,
            paymentId: captureResult.id || '',
            amount: amount,
            currency: captureDetails?.amount?.currency_code || 'MXN',
            paymentType: 'PAYPAL',
            transactionFee: paypalFee.transactionFee,
            netAmount: paypalFee.netAmount,
            feeSource: paypalFee.feeSource,
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

        // Send payment confirmation emails. Same pattern as the Stripe webhook —
        // persist outcome rather than throwing so PayPal doesn't retry the capture.
        await recordEmailDelivery(cartId, () => emailService.sendPaymentEmails(cartId));
        sendGiftReceivedPush(cartId);

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

  /**
   * Stripe checkout for the fixed plan, in two modes:
   *
   *   UPGRADE (current) — an authenticated couple publishing an existing draft.
   *     Identified by a session plus `giftListId`; carries only ids in metadata.
   *   SIGNUP (legacy)   — an anonymous caller paying before the account exists.
   *     Used by App Store builds <= 1.0.2 (18). Carries the whole signup payload.
   *
   * The route is mounted with `optionalAuthenticateSession` so both can reach it.
   */
  createPlanCheckoutSession: async (req: Request, res: Response) => {
    try {
      const {
        planType,
        email,
        password,
        firstName,
        lastName,
        spouseFirstName,
        spouseLastName,
        phoneNumber,
        slug,
        successUrl,
        cancelUrl,
        discountCode,
        eventDate,
        giftListId,
      } = req.body;

      // Only fixed plan requires payment
      if (planType !== 'FIXED') {
        return res.status(400).json({
          success: false,
          message: 'Only fixed plan requires payment',
        });
      }

      const isUpgrade = !!req.user && !!giftListId;

      if (isUpgrade) {
        return createFixedPlanUpgradeSession(req, res, {
          userId: req.user!.userId,
          giftListId: Number(giftListId),
          successUrl,
          cancelUrl,
          discountCode,
        });
      }

      // phoneNumber is optional (App Store guideline 5.1.1(v)).
      if (!email || !password || !firstName || !lastName || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Missing required signup data for plan checkout',
        });
      }

      // Validate discount code if provided
      let validatedDiscountCode = null;
      let finalAmount = 200000; // $2,000 MXN in cents

      if (discountCode) {
        const validation = await discountCodeService.validateDiscountCode(discountCode);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.error,
          });
        }
        validatedDiscountCode = validation.discountCode;

        // Calculate discounted amount
        const baseAmount = 2000; // $2,000 MXN
        let discountedAmount = baseAmount;

        if (validatedDiscountCode!.discountType === 'PERCENTAGE') {
          discountedAmount = baseAmount - (baseAmount * validatedDiscountCode!.discountValue) / 100;
        } else {
          // FIXED_AMOUNT
          discountedAmount = baseAmount - validatedDiscountCode!.discountValue;
        }

        finalAmount = Math.max(0, Math.round(discountedAmount * 100)); // Convert to cents
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create line item for plan payment
      const lineItems = [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Plan Fijo - MesaLista',
              description: validatedDiscountCode
                ? `Pago único para acceso completo a MesaLista sin comisiones por ventas (Código: ${validatedDiscountCode.code})`
                : 'Pago único para acceso completo a MesaLista sin comisiones por ventas',
            },
            unit_amount: finalAmount,
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
          passwordHash,
          firstName,
          lastName,
          spouseFirstName: spouseFirstName || '',
          spouseLastName: spouseLastName || '',
          phoneNumber: phoneNumber || '',
          slug,
          ...(eventDate && { eventDate }),
          ...(validatedDiscountCode && {
            discountCodeId: validatedDiscountCode.id.toString(),
            discountCode: validatedDiscountCode.code,
          }),
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

  completePlanSignupSession: async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Both plan rails land here: PLAN_UPGRADE publishes an existing draft,
      // PLAN_SUBSCRIPTION is the legacy pre-account signup from old iOS builds.
      const paymentFor = session.metadata?.paymentFor;
      if (paymentFor !== 'PLAN_UPGRADE' && paymentFor !== 'PLAN_SUBSCRIPTION') {
        return res.status(400).json({ success: false, message: 'Invalid checkout session' });
      }

      if (session.payment_status !== 'paid') {
        return res.status(409).json({ success: false, message: 'Payment has not been completed yet' });
      }

      const provisioned = await provisionFixedPlanSignupFromMetadata({
        metadata: session.metadata,
        amount: (session.amount_total || 0) / 100,
        source: 'success_page_recovery',
      });

      if (!provisioned?.user) {
        return res.status(500).json({ success: false, message: 'Failed to provision account' });
      }

      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;

      await createSessionAndSetCookie(res, provisioned.user.id, userAgent, ipAddress);

      res.json({
        success: true,
        slug: provisioned.user.slug,
        planType: 'FIXED',
        giftListId: provisioned.giftList.id,
      });
    } catch (error) {
      console.error('Error completing fixed plan signup session:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete plan signup',
      });
    }
  },

  // --- iOS fixed-plan In-App Purchase (RevenueCat) ---

  // Step 1 of the iOS fixed-plan flow. Stashes the intent keyed by the RevenueCat
  // app user id so it can be acted on after the anonymous Apple purchase confirms.
  // No payment happens here — that's Apple's job — and no discount is accepted
  // (IAP prices are fixed App Store tiers).
  //
  // UPGRADE mode (authenticated + giftListId) stores only ids. SIGNUP mode stores
  // the hashed signup payload for App Store builds <= 1.0.2 (18).
  preparePlanIapSignup: async (req: Request, res: Response) => {
    try {
      const {
        appUserId,
        email,
        password,
        firstName,
        lastName,
        spouseFirstName,
        spouseLastName,
        phoneNumber,
        slug,
        eventDate,
        giftListId,
      } = req.body;

      if (!appUserId) {
        return res.status(400).json({ success: false, message: 'appUserId is required' });
      }

      if (req.user && giftListId) {
        const giftList = await prisma.giftList.findUnique({
          where: { id: Number(giftListId) },
          select: { id: true, userId: true, planType: true, publishedAt: true },
        });

        if (!giftList || giftList.userId !== req.user.userId) {
          return res.status(404).json({ success: false, message: 'Gift list not found' });
        }
        if (giftList.planType !== null || giftList.publishedAt !== null) {
          return res.status(409).json({ success: false, message: 'Esta mesa de regalos ya fue publicada' });
        }

        const upgradeData = {
          userId: req.user.userId,
          giftListId: giftList.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        };

        await prisma.pendingPlanSignup.upsert({
          where: { appUserId },
          create: { appUserId, ...upgradeData },
          update: upgradeData,
        });

        return res.json({ success: true });
      }

      // phoneNumber is optional (App Store guideline 5.1.1(v)).
      if (!email || !password || !firstName || !lastName || !slug) {
        return res.status(400).json({ success: false, message: 'Missing required signup data for plan purchase' });
      }

      // Don't let an IAP flow silently collide with an existing account or slug —
      // the couple would pay and then fail to provision.
      const [existingEmail, existingSlug] = await Promise.all([
        prisma.user.findUnique({ where: { email }, select: { id: true } }),
        prisma.user.findUnique({ where: { slug }, select: { id: true } }),
      ]);
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Ya existe una cuenta con este correo' });
      }
      if (existingSlug) {
        return res.status(409).json({ success: false, message: 'Este enlace ya está en uso' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const data = {
        email,
        passwordHash,
        firstName,
        lastName,
        spouseFirstName: spouseFirstName || null,
        spouseLastName: spouseLastName || null,
        phoneNumber: phoneNumber || null,
        slug,
        eventDate: eventDate ? new Date(eventDate) : null,
        expiresAt,
      };

      // Upsert so a retried purchase (same appUserId) refreshes rather than errors.
      await prisma.pendingPlanSignup.upsert({
        where: { appUserId },
        create: { appUserId, ...data },
        update: data,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error preparing plan IAP signup:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare plan purchase',
      });
    }
  },

  // Step 2 of the iOS fixed-plan flow. Called after the native purchase resolves.
  // Verifies the entitlement with RevenueCat's REST API (never the client), then
  // provisions the account and returns a Bearer token so the app signs in.
  completePlanIapSignup: async (req: Request, res: Response) => {
    try {
      const { appUserId } = req.body;
      if (!appUserId) {
        return res.status(400).json({ success: false, message: 'appUserId is required' });
      }

      const pending = await prisma.pendingPlanSignup.findUnique({ where: { appUserId } });
      if (!pending) {
        return res.status(404).json({ success: false, message: 'No pending signup found for this purchase' });
      }

      const entitled = await hasActiveFixedPlanEntitlement(appUserId);
      if (!entitled) {
        // 402 Payment Required — the purchase hasn't landed at RevenueCat yet.
        return res.status(402).json({ success: false, message: 'Payment could not be verified' });
      }

      const provisioned = await provisionFixedPlanSignupFromMetadata({
        metadata: pendingSignupToMetadata(pending),
        amount: FIXED_PLAN_AMOUNT_MXN,
        source: 'success_page_recovery',
      });

      if (!provisioned?.user) {
        return res.status(500).json({ success: false, message: 'Failed to provision account' });
      }

      await prisma.pendingPlanSignup.delete({ where: { appUserId } }).catch(() => {});

      // UPGRADE mode: the couple is already signed in, so don't mint a second
      // session. SIGNUP mode has no session yet and needs one to land the app.
      const isUpgrade = !!pending.userId;
      if (isUpgrade) {
        return res.json({
          success: true,
          slug: provisioned.user.slug,
          planType: 'FIXED',
          giftListId: provisioned.giftList.id,
        });
      }

      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;
      const session = await createSessionAndSetCookie(res, provisioned.user.id, userAgent, ipAddress);

      res.json({
        success: true,
        slug: provisioned.user.slug,
        planType: 'FIXED',
        giftListId: provisioned.giftList.id,
        token: session.token, // mobile is Bearer-token based; web relies on the cookie
      });
    } catch (error) {
      console.error('Error completing plan IAP signup:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete plan purchase',
      });
    }
  },

  // Backstop for step 2: if the app dies between the Apple purchase and calling
  // /complete, RevenueCat still fires this server-to-server webhook so the account
  // is provisioned anyway. Idempotent — provisioning dedupes on the existing
  // fixed-plan gift list, and the pending row is deleted on success.
  handleRevenueCatWebhook: async (req: Request, res: Response) => {
    try {
      const auth = req.get('Authorization');
      if (!REVENUECAT_WEBHOOK_SECRET || auth !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const event = req.body?.event;
      const type: string | undefined = event?.type;
      const appUserId: string | undefined = event?.app_user_id;

      // A one-time non-consumable comes through as NON_RENEWING_PURCHASE; the
      // others cover edge cases (sandbox/restore) that still grant entitlement.
      const purchaseTypes = ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'UNCANCELLATION'];
      if (type && appUserId && purchaseTypes.includes(type)) {
        const pending = await prisma.pendingPlanSignup.findUnique({ where: { appUserId } });
        if (pending) {
          const provisioned = await provisionFixedPlanSignupFromMetadata({
            metadata: pendingSignupToMetadata(pending),
            amount: FIXED_PLAN_AMOUNT_MXN,
            source: 'checkout.session.completed',
          });
          if (provisioned?.user) {
            await prisma.pendingPlanSignup.delete({ where: { appUserId } }).catch(() => {});
          }
        }
      }

      // Always 200 so RevenueCat doesn't retry-storm on events we intentionally ignore.
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling RevenueCat webhook:', error);
      res.status(500).json({ received: false });
    }
  },

  // Create Stripe checkout session for additional gift list payment
  createGiftListCheckoutSession: async (req: Request, res: Response) => {
    try {
      const { userId, planType, giftListData, successUrl, cancelUrl, discountCode } = req.body;

      if (!userId || !planType || !giftListData) {
        return res.status(400).json({
          success: false,
          message: 'User ID, plan type, and gift list data are required',
        });
      }

      // Only fixed plan requires payment
      if (planType !== 'FIXED') {
        return res.status(400).json({
          success: false,
          message: 'Only fixed plan requires payment',
        });
      }

      // Validate discount code if provided
      let validatedDiscountCode = null;
      let finalAmount = 100000; // $1,000 MXN in cents

      if (discountCode) {
        const validation = await discountCodeService.validateDiscountCode(discountCode);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.error,
          });
        }
        validatedDiscountCode = validation.discountCode;

        // Calculate discounted amount
        const baseAmount = 1000; // $1,000 MXN
        let discountedAmount = baseAmount;

        if (validatedDiscountCode!.discountType === 'PERCENTAGE') {
          discountedAmount = baseAmount - (baseAmount * validatedDiscountCode!.discountValue) / 100;
        } else {
          // FIXED_AMOUNT
          discountedAmount = baseAmount - validatedDiscountCode!.discountValue;
        }

        finalAmount = Math.max(0, Math.round(discountedAmount * 100)); // Convert to cents
      }

      // Create line item for gift list payment
      const lineItems = [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Nueva Lista de Regalos - Plan Fijo',
              description: validatedDiscountCode
                ? `Pago único para nueva lista de regalos sin comisiones (Código: ${validatedDiscountCode.code})`
                : 'Pago único para nueva lista de regalos sin comisiones por ventas',
            },
            unit_amount: finalAmount,
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
        metadata: {
          userId: userId.toString(),
          planType: 'FIXED',
          paymentFor: 'GIFT_LIST_CREATION',
          giftListData: JSON.stringify(giftListData),
          ...(validatedDiscountCode && {
            discountCodeId: validatedDiscountCode.id.toString(),
            discountCode: validatedDiscountCode.code,
          }),
        },
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating gift list checkout session:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout session',
      });
    }
  },

  // Get purchased gifts by wedding list ID
  getPurchasedGiftsByWeddingList: async (req: Request, res: Response) => {
    try {
      const { weddingListId } = req.params;

      if (!weddingListId || Array.isArray(weddingListId)) {
        return res.status(400).json({
          success: false,
          message: 'Gift list ID is required',
        });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Confirm caller owns the gift list. Without this anyone authenticated could read
      // any couple's purchase list, including guest names / emails / messages.
      const owned = await prisma.giftList.findFirst({
        where: { id: Number(weddingListId), userId: req.user.userId },
        select: { id: true },
      });
      if (!owned) {
        return res.status(404).json({ success: false, message: 'Gift list not found' });
      }

      // Get all payments for gifts in this wedding list
      const payments = await prisma.payment.findMany({
        where: {
          status: 'PAID',
          cart: {
            items: {
              some: {
                gift: {
                  giftListId: Number(weddingListId),
                },
              },
            },
          },
        },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  gift: {
                    include: {
                      categories: {
                        include: {
                          category: true,
                        },
                      },
                    },
                  },
                },
                where: {
                  gift: {
                    giftListId: Number(weddingListId),
                  },
                },
              },
              invitee: true, // Include RSVP invitee information
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format the response
      const purchasedGifts = payments.flatMap((payment: any) =>
        payment.cart.items.map((item: any) => ({
          id: item.id,
          giftTitle: item.gift.title,
          guestName: payment.cart.inviteeName || 'Anónimo',
          guestEmail: payment.cart.inviteeEmail || '',
          message: payment.cart.message || '',
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
          categories:
            item.gift.categories
              .map((catRel: any) => catRel.category?.name)
              .filter(Boolean)
              .join(', ') || 'Sin categoría',
          paymentType: payment.paymentType,
          paymentDate: payment.createdAt.toISOString(),
          currency: payment.currency,
          rsvpCode: payment.cart.rsvpCode || null,
          rsvpInvitee: payment.cart.invitee
            ? {
                firstName: payment.cart.invitee.firstName,
                lastName: payment.cart.invitee.lastName,
                status: payment.cart.invitee.status,
              }
            : null,
        })),
      );

      res.json({
        success: true,
        data: purchasedGifts,
      });
    } catch (error) {
      console.error('Error getting purchased gifts:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get purchased gifts',
      });
    }
  },

  /**
   * Bridge Stripe/PayPal hosted-checkout returns back into the mobile app.
   *
   * Stripe and PayPal only accept http(s) success/cancel URLs, so the native
   * app can't hand them its `mobile://` (or Expo Go `exp://`) deep link
   * directly. Instead the app points the provider at this endpoint and passes
   * its own deep link as the `redirect` query param. We 302 back to that deep
   * link, forwarding any provider-appended params (PayPal adds `token` and
   * `PayerID`), which closes the in-app browser and resumes the app.
   */
  handleMobileReturn: (req: Request, res: Response) => {
    const { redirect, ...rest } = req.query;

    if (!redirect || typeof redirect !== 'string') {
      return res.status(400).send('Missing redirect target');
    }

    let target: URL;
    try {
      target = new URL(redirect);
    } catch {
      return res.status(400).send('Invalid redirect target');
    }

    // Only allow app deep-link schemes to prevent this from acting as an open
    // redirect to arbitrary http(s) destinations. 'mesalista:' is the installed
    // app (app.json scheme); 'exp:'/'exps:' cover Expo Go dev sessions.
    const allowedSchemes = ['mesalista:', 'mobile:', 'exp:', 'exps:'];
    if (!allowedSchemes.includes(target.protocol)) {
      return res.status(400).send('Disallowed redirect scheme');
    }

    // Forward any extra query params (status, PayPal token/PayerID, etc.).
    for (const [key, value] of Object.entries(rest)) {
      if (value == null) continue;
      target.searchParams.set(key, Array.isArray(value) ? String(value[0]) : String(value));
    }

    return res.redirect(302, target.toString());
  },
};
