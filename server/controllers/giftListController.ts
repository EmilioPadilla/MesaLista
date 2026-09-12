import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateGiftListRequest, GiftListBrief, UpdateGiftListRequest } from 'types/models/giftList.js';
import { WhereClause } from 'types/clauses.js';
// Aliased to keep it distinct from the controller method of the same name below.
import { publishGiftList as publishGiftListRecord } from '../services/giftListPublishService.js';
import emailService from '../services/emailService.js';

const prisma = new PrismaClient();

/**
 * A list with `publishedAt: null` is a draft — the couple is still building it.
 * Drafts are invisible to everyone but their owner, so every guest-facing read
 * filters on this and every owner-facing read does not.
 */
const PUBLISHED_ONLY = { publishedAt: { not: null } } as const;

/**
 * Guest-facing reads are mounted with `optionalAuthenticateSession`, so a signed-in
 * owner previewing their own draft still gets it while everyone else gets a 404.
 */
const canView = (list: { publishedAt: Date | null; userId: number }, req: Request): boolean =>
  list.publishedAt !== null || req.user?.userId === list.userId;

/** True when the list exists and the caller is allowed to see it. */
const isViewableList = async (giftListId: number, req: Request): Promise<boolean> => {
  const list = await prisma.giftList.findUnique({
    where: { id: giftListId },
    select: { publishedAt: true, userId: true },
  });
  return !!list && canView(list, req);
};

const giftListController = {
  getAllGiftLists: async (_req: Request, res: Response) => {
    try {
      // Include inactive (closed) lists so the search page can show them in a disabled state.
      // The frontend uses `isActive` to render them as closed and to block navigation.
      const giftLists = await prisma.giftList.findMany({
        where: {
          isPublic: true,
          // Drafts never appear in search, even if isPublic was somehow set.
          ...PUBLISHED_ONLY,
        },
        include: {
          gifts: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              spouseFirstName: true,
              spouseLastName: true,
              imageUrl: true,
              email: true,
              slug: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          invitation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      });

      const formattedGiftLists = giftLists.map(
        (list: any): GiftListBrief => ({
          id: list.id,
          coupleName: list.coupleName,
          eventDate: list.eventDate.toISOString(),
          imageUrl: list.imageUrl,
          eventLocation: list.eventLocation,
          eventVenue: list.eventVenue,
          description: list.description,
          totalGifts: list.gifts.length,
          purchasedGifts: list.gifts.filter((gift: any) => gift.isPurchased).length,
          userSlug: list.user.slug,
          isActive: list.isActive,
          invitationSlug: list.invitation?.status === 'PUBLISHED' ? `${list.user.slug}/${list.id}` : undefined,
        }),
      );

      res.json(formattedGiftLists);
    } catch (error) {
      console.error('Error fetching gift lists:', error);
      res.status(500).json({ error: 'Failed to fetch gift lists' });
    }
  },

  getGiftListsByUser: async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // A logged-in user can only enumerate their own lists. Admins are not granted
    // a broader view here — this endpoint is reached from the couple dashboard.
    if (!req.user || req.user.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const giftLists = await prisma.giftList.findMany({
        where: { userId: Number(userId) },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const transformedLists = giftLists.map((list: any) => ({
        ...list,
        gifts: list.gifts.map((gift: any) => ({
          ...gift,
          categories: Array.isArray(gift.categories)
            ? gift.categories
                .map((catRel: any) =>
                  catRel.category && catRel.category.id && catRel.category.name
                    ? { id: catRel.category.id, name: catRel.category.name }
                    : null,
                )
                .filter(Boolean)
            : [],
        })),
      }));

      res.json(transformedLists);
    } catch (error) {
      console.error('Error fetching gift lists:', error);
      res.status(500).json({ error: 'Failed to fetch gift lists' });
    }
  },

  getGiftListById: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      const giftList = await prisma.giftList.findUnique({
        where: { id: Number(giftListId) },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Unpublished lists read as non-existent to anyone but their owner.
      if (!giftList || !canView(giftList, req)) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const transformedGifts = giftList.gifts.map((gift: any) => ({
        ...gift,
        categories: Array.isArray(gift.categories)
          ? gift.categories
              .map((catRel: any) =>
                catRel.category && catRel.category.id && catRel.category.name
                  ? { id: catRel.category.id, name: catRel.category.name }
                  : null,
              )
              .filter(Boolean)
          : [],
      }));
      res.json({ ...giftList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching gift list:', error);
      res.status(500).json({ error: 'Failed to fetch gift list' });
    }
  },

  getFirstGiftListByUserSlug: async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug || Array.isArray(slug)) {
      return res.status(400).json({ error: 'User slug is required' });
    }

    try {
      // First, find the user by slug
      const user = await prisma.user.findUnique({
        where: { slug: slug as string },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the first gift list for this user (oldest created).
      // Inactive lists are included so BuyGifts can render the closed-list warning.
      // Drafts are excluded unless the owner is the one asking — this is the
      // registry a guest lands on at /:slug, so it must not leak work in progress.
      const isOwner = req.user?.userId === user.id;
      const giftList = await prisma.giftList.findFirst({
        where: {
          userId: user.id,
          ...(isOwner ? {} : PUBLISHED_ONLY),
        },
        include: {
          gifts: {
            include: {
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      });

      if (!giftList) {
        return res.status(404).json({ error: 'No gift lists found for this user' });
      }

      const transformedGifts = giftList.gifts.map((gift: any) => ({
        ...gift,
        categories: Array.isArray(gift.categories)
          ? gift.categories
              .map((catRel: any) =>
                catRel.category && catRel.category.id && catRel.category.name
                  ? { id: catRel.category.id, name: catRel.category.name }
                  : null,
              )
              .filter(Boolean)
          : [],
      }));
      res.json({ ...giftList, gifts: transformedGifts });
    } catch (error) {
      console.error('Error fetching first gift list by user slug:', error);
      res.status(500).json({ error: 'Failed to fetch gift list' });
    }
  },

  createGiftList: async (req: Request, res: Response) => {
    const { title, description, coupleName, eventDate, imageUrl, discountCodeId } = req.body as CreateGiftListRequest;
    // `planType` is intentionally NOT read from the body. Every list starts as a
    // draft and gets its plan from the publish endpoint, which is the only place
    // payment is verified — accepting it here would hand out fixed plans for free.

    // userId comes from the authenticated session, never the request body. Otherwise
    // any logged-in user could create a list owned by anyone.
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!title || !coupleName || !eventDate) {
      return res.status(400).json({ error: 'Title, couple name, and event date are required' });
    }

    try {
      const giftList = await prisma.giftList.create({
        data: {
          userId: req.user.userId,
          title,
          description,
          coupleName,
          eventDate: new Date(eventDate),
          imageUrl,
          planType: null,
          publishedAt: null,
          isPublic: false,
          discountCodeId: discountCodeId ? Number(discountCodeId) : undefined,
        },
      });

      // Admin heads-up that another list was opened. This path is a couple who
      // already has an account adding a second list, so it is always a draft —
      // the publish notification comes later, from publishGiftList. Never throws.
      await emailService.sendAdminGiftListCreatedNotification({
        userId: req.user.userId,
        giftListId: giftList.id,
        giftListTitle: giftList.title,
        coupleName: giftList.coupleName,
        eventDate: giftList.eventDate,
        planType: null,
      });

      res.status(201).json(giftList);
    } catch (error: any) {
      console.error('Error creating gift list:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A gift list with this data already exists' });
      }

      res.status(500).json({ error: 'Failed to create gift list' });
    }
  },

  /**
   * Publishes a draft: assigns its plan and makes it visible to guests.
   *
   * Only the commission plan can be published here, because it is the only one
   * that costs nothing up front. The fixed plan is published by the payment
   * controller once Stripe or RevenueCat confirms the charge — otherwise this
   * endpoint would hand out $2,000 plans to anyone who can POST.
   */
  publishGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const { planType } = req.body as { planType?: string };

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const id = Number(giftListId);
    if (!giftListId || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    if (planType !== 'COMMISSION' && planType !== 'FIXED') {
      return res.status(400).json({ error: 'planType must be FIXED or COMMISSION' });
    }

    if (planType === 'FIXED') {
      return res.status(402).json({
        error: 'El Plan Fijo requiere completar el pago antes de publicar',
        code: 'PAYMENT_REQUIRED',
      });
    }

    try {
      const result = await publishGiftListRecord({ giftListId: id, userId: req.user.userId, planType: 'COMMISSION' });

      if (!result.ok) {
        return result.reason === 'NOT_FOUND'
          ? res.status(404).json({ error: 'Gift list not found' })
          : res.status(409).json({ error: 'Esta mesa de regalos ya fue publicada' });
      }

      res.json(result.giftList);
    } catch (error) {
      console.error('Error publishing gift list:', error);
      res.status(500).json({ error: 'Failed to publish gift list' });
    }
  },

  updateGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const {
      title,
      description,
      coupleName,
      eventDate,
      eventLocation,
      eventVenue,
      imageUrl,
      invitationCount,
      isActive,
      isPublic,
      feePreference,
      thankYouMessage,
    } = req.body as UpdateGiftListRequest;
    // `planType` is intentionally NOT destructured — it must be immutable post-creation.
    // Letting it change would retroactively distort the FIXED/COMMISSION split in analytics
    // and could let a couple downgrade from FIXED to COMMISSION after paying for FIXED.
    // The one legal null -> plan transition lives in publishGiftList above.

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const id = Number(giftListId);
    const userId = req.user.userId;

    try {
      // Fee-preference change is locked once any gift has been purchased. Express the
      // check atomically by adding `gifts: { none: { isPurchased: true } }` to the
      // update's where clause — this prevents the read-then-write race where two
      // concurrent updates (or a webhook flipping isPurchased between the read and
      // the write) could slip a change through after the first purchase.
      const wantsFeePreferenceChange = feePreference !== undefined;

      const data: any = {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coupleName && { coupleName }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(eventLocation !== undefined && { eventLocation }),
        ...(eventVenue !== undefined && { eventVenue }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(invitationCount !== undefined && { invitationCount }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(wantsFeePreferenceChange && { feePreference }),
        ...(thankYouMessage !== undefined && { thankYouMessage }),
      };

      const where: any = { id, userId };
      if (wantsFeePreferenceChange) {
        // Restrict update: this list, owned by the caller, AND no purchased gifts yet.
        where.gifts = { none: { isPurchased: true } };
      }

      const result = await prisma.giftList.updateMany({ where, data });

      if (result.count === 0) {
        // Either: list doesn't exist, caller doesn't own it, or fee-pref change was blocked
        // by an existing purchase. Disambiguate so the FE can surface the right message.
        if (wantsFeePreferenceChange) {
          const existing = await prisma.giftList.findFirst({
            where: { id, userId },
            select: { id: true },
          });
          if (existing) {
            return res.status(403).json({
              error:
                'No puedes cambiar la configuración de comisiones porque ya has recibido regalos. Contacta a info@mesalista.com.mx para solicitar cambios.',
            });
          }
        }
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const giftList = await prisma.giftList.findUnique({ where: { id } });
      res.json(giftList);
    } catch (error: any) {
      console.error('Error updating gift list:', error);
      res.status(500).json({ error: 'Failed to update gift list' });
    }
  },

  deleteGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Owner-scoped delete: non-owners get count === 0 → 404 in a single round-trip.
      const result = await prisma.giftList.deleteMany({
        where: { id: Number(giftListId), userId: req.user.userId },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      res.json({ message: 'Gift list deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting gift list:', error);
      res.status(500).json({ error: 'Failed to delete gift list' });
    }
  },

  getGiftsByGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const { category, minPrice, maxPrice, sortOrder } = req.query;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      // Gifts are the substance of a registry — gate them exactly like the list itself.
      if (!(await isViewableList(Number(giftListId), req))) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const whereClause: WhereClause = {
        giftListId: Number(giftListId),
      };

      if (category) {
        whereClause.categories = {
          some: {
            category: {
              name: category.toString(),
            },
          },
        };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        if (minPrice !== undefined) {
          whereClause.price = {
            gte: Number(minPrice),
          };
        }

        if (maxPrice !== undefined) {
          whereClause.price = {
            lte: Number(maxPrice),
          };
        }
      }

      const priceOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const gifts = await prisma.gift.findMany({
        where: whereClause,
        include: {
          giftList: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ price: priceOrder }, { createdAt: 'asc' }],
      });

      const formattedGifts = gifts.map((gift: any) => ({
        ...gift,
        categories: gift.categories.map((cat: any) => cat.category.name),
      }));

      res.json(formattedGifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      res.status(500).json({ error: 'Failed to fetch gifts' });
    }
  },

  getCategoriesInGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    try {
      if (!(await isViewableList(Number(giftListId), req))) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const categoriesOnGifts = await prisma.giftCategoryOnGift.findMany({
        where: { giftListId: Number(giftListId) },
        include: { category: true },
      });

      const categoryMap = new Map<number, string>();
      categoriesOnGifts.forEach((item: any) => {
        if (item.category) {
          categoryMap.set(item.category.id, item.category.name);
        }
      });

      const categories = Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  reorderGiftsInGiftList: async (req: Request, res: Response) => {
    const { giftListId } = req.params;
    const { giftOrders } = req.body;

    if (!giftListId) {
      return res.status(400).json({ error: 'Gift list ID is required' });
    }

    if (!giftOrders || !Array.isArray(giftOrders)) {
      return res.status(400).json({ error: 'Gift orders array is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Confirm caller owns the gift list before touching any gifts. One extra round-trip
      // here, but it short-circuits before opening a transaction for a non-owner.
      const owned = await prisma.giftList.findFirst({
        where: { id: Number(giftListId), userId: req.user.userId },
        select: { id: true },
      });
      if (!owned) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      // @ts-ignore
      await prisma.$transaction(async (tx) => {
        for (const { giftId, order } of giftOrders) {
          await tx.gift.update({
            where: {
              id: Number(giftId),
              giftListId: Number(giftListId),
            },
            data: {
              order: Number(order),
            },
          });
        }
      });

      res.json({ message: 'Gift order updated successfully' });
    } catch (error) {
      console.error('Error updating gift order:', error);
      res.status(500).json({ error: 'Failed to update gift order' });
    }
  },
};

export default giftListController;
