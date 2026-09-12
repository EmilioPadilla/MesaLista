import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

const COUPLE_SUBROUTES = ['gestionar', 'listas', 'crear-lista', 'configuracion', 'invitacion', 'gestionar-rsvp'];
const RESERVED_TOP_LEVEL_PATHS = [
  'login',
  'olvide-contrasena',
  'restablecer-contrasena',
  'registro',
  'registro-exitoso',
  'buscar',
  'contacto',
  'precios',
  'colecciones',
  'admin',
];

/**
 * Unique sessions that opened a public registry (`/:slug` or `/:slug/regalos`).
 * PAGE_VIEW paths are the only signal we have for "looked at a mesa"; product
 * tables take over from add-to-cart onward.
 */
async function countRegistryViewSessions(fromDate: Date, toDate: Date, slug?: string | null): Promise<number> {
  try {
    if (slug) {
      const exact = `/${slug}`;
      const prefix = `/${slug}/%`;
      const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT session_id) AS count
        FROM analytics_events
        WHERE event_type::text = 'PAGE_VIEW'
          AND created_at >= ${fromDate}
          AND created_at <= ${toDate}
          AND (
            metadata->>'path' = ${exact}
            OR metadata->>'path' LIKE ${prefix}
          )
          AND COALESCE(split_part(metadata->>'path', '/', 3), '') NOT IN (${Prisma.join(
            COUPLE_SUBROUTES.map((s) => Prisma.sql`${s}`),
          )})
      `;
      return Number(rows[0]?.count ?? 0);
    }

    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT session_id) AS count
      FROM analytics_events
      WHERE event_type::text = 'PAGE_VIEW'
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
        AND (
          (
            metadata->>'path' ~ '^/[^/]+$'
            AND split_part(metadata->>'path', '/', 2) NOT IN (${Prisma.join(
              RESERVED_TOP_LEVEL_PATHS.map((s) => Prisma.sql`${s}`),
            )})
          )
          OR metadata->>'path' LIKE '%/regalos'
        )
    `;
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    console.error('Error counting registry views:', error);
    return 0;
  }
}

/**
 * Per-day counts straight from a product table, so a trend line matches the
 * summary card it sits under. `analytics_daily` only ever aggregated events.
 */
type ProductSeriesMetric = 'signupsCompleted' | 'draftsCreated' | 'giftsAdded' | 'registriesPublished' | 'cartsWithItems' | 'giftPurchases';

const PRODUCT_TIME_SERIES: Record<ProductSeriesMetric, Prisma.Sql> = {
  signupsCompleted: Prisma.sql`SELECT created_at AS ts FROM users WHERE role = 'COUPLE'`,
  draftsCreated: Prisma.sql`SELECT created_at AS ts FROM gift_lists`,
  giftsAdded: Prisma.sql`SELECT created_at AS ts FROM gifts`,
  registriesPublished: Prisma.sql`SELECT published_at AS ts FROM gift_lists WHERE published_at IS NOT NULL`,
  // One row per cart, dated by the first item added to it.
  cartsWithItems: Prisma.sql`SELECT MIN(created_at) AS ts FROM cart_items GROUP BY cart_id`,
  giftPurchases: Prisma.sql`SELECT created_at AS ts FROM payments WHERE status = 'PAID'`,
};

async function countByDay(source: Prisma.Sql, fromDate: Date, toDate: Date): Promise<TimeSeriesData[]> {
  const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT date_trunc('day', src.ts) AS day, COUNT(*) AS count
    FROM (${source}) AS src
    WHERE src.ts >= ${fromDate} AND src.ts <= ${toDate}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((row) => ({
    date: row.day.toISOString().split('T')[0],
    value: Number(row.count),
  }));
}

interface LogEventParams {
  sessionId: string;
  eventType: string;
  userId?: number;
  metadata?: Record<string, any>;
}

interface SessionParams {
  sessionId: string;
  userId?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPage?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ConversionMetrics {
  registryAttempts: number;
  signupsCompleted: number;
  draftsCreated: number;
  draftsWithGifts: number;
  giftsAdded: number;
  registriesPublished: number;
  publishedFixed: number;
  publishedCommission: number;
  registryViewers: number;
  cartsWithItems: number;
  checkoutsStarted: number;
  giftPurchases: number;
  giftsSold: number;
  giftPurchaseAmount: number;
  attemptToSignupRate: number;
  attemptToDraftRate: number;
  draftActivationRate: number;
  draftToPublishRate: number;
  cartToPurchaseRate: number;
  checkoutCompletionRate: number;
  checkoutAbandonments: number;
  checkoutAbandonmentRate: number;
}

interface MetricsSummary {
  visitors: number;
  signIns: number;
  registryAttempts: number;
  registryPurchases: number;
  // Free-to-build funnel. Signup and payment used to be one step, so
  // `registryPurchases` covered both; these split them apart.
  signupsCompleted: number;
  draftsCreated: number;
  draftsWithGifts: number;
  giftsAdded: number;
  registriesPublished: number;
  publishedFixed: number;
  publishedCommission: number;
  registryViewers: number;
  cartsWithItems: number;
  giftPurchases: number;
  giftsSold: number;
  giftPurchaseAmount: number;
  viewPricing: number;
  viewRegistryBuilder: number;
  startCheckouts: number;
  checkoutErrors: number;
  checkoutAbandonments: number;
  avgPagesPerSession: number;
  avgSessionDurationMs: number;
  signInRate: number;
  registryPurchaseRate: number;
  attemptToSignupRate: number;
  attemptToDraftRate: number;
  draftActivationRate: number;
  draftToPublishRate: number;
  cartToPurchaseRate: number;
  checkoutCompletionRate: number;
  giftPurchaseRate: number;
  checkoutAbandonmentRate: number;
  topUtmSources?: Array<{ source: string; visitors: number; conversions: number; conversionRate: number }>;
  topLandingPages?: Array<{ page: string; visitors: number; conversions: number; conversionRate: number }>;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface FunnelBreakdown {
  group: string;
  visitors: number;
  signIns: number;
  startCheckouts: number;
  purchases: number;
  checkoutAbandonments: number;
  signInRate: number;
  checkoutRate: number;
  purchaseRate: number;
  abandonmentRate: number;
}

export const analyticsService = {
  /**
   * Hash user ID for privacy (SHA256)
   */
  hashUserId(userId: number): string {
    return crypto.createHash('sha256').update(userId.toString()).digest('hex');
  },

  /**
   * Product-table conversion metrics. Client events undercount (adblock, mobile
   * gaps, list-filter by owner hash hiding guest purchases). gift_lists / carts /
   * payments are the source of truth for "did someone create a mesa / buy a gift".
   *
   * The two exceptions are intent, which leaves no row behind: REGISTRY_ATTEMPT
   * (opened the signup form) and START_CHECKOUT (hit pay). A `payments` row is
   * only written after the charge clears, so counting it as "started checkout"
   * would make abandonment permanently zero.
   */
  async getConversionMetrics(fromDate: Date, toDate: Date, weddingListId?: number, slug?: string | null): Promise<ConversionMetrics> {
    const createdInRange = { gte: fromDate, lte: toDate };
    const listWhere = weddingListId ? { id: weddingListId } : {};
    const cartForList = weddingListId ? { giftListId: weddingListId } : { giftListId: { not: null } };

    const [
      attemptSessions,
      signupsCompleted,
      draftsCreated,
      draftsWithGifts,
      giftsAdded,
      registriesPublished,
      publishedByPlan,
      registryViewers,
      cartsWithItems,
      checkoutStartEvents,
      giftPurchases,
      paidAmount,
      giftsSold,
    ] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { eventType: 'REGISTRY_ATTEMPT', createdAt: createdInRange },
      }),
      // Signup and the first draft are one transaction (userController.signup),
      // so this is "attempted and got all the way through the form".
      weddingListId ? Promise.resolve(0) : prisma.user.count({ where: { role: 'COUPLE', createdAt: createdInRange } }),
      prisma.giftList.count({ where: { ...listWhere, createdAt: createdInRange } }),
      prisma.giftList.count({
        where: { ...listWhere, createdAt: createdInRange, gifts: { some: {} } },
      }),
      prisma.gift.count({
        where: { createdAt: createdInRange, ...(weddingListId ? { giftListId: weddingListId } : {}) },
      }),
      prisma.giftList.count({ where: { ...listWhere, publishedAt: createdInRange } }),
      prisma.giftList.groupBy({
        by: ['planType'],
        where: { ...listWhere, publishedAt: createdInRange, planType: { not: null } },
        _count: true,
      }),
      countRegistryViewSessions(fromDate, toDate, slug),
      prisma.cart.count({
        where: { ...cartForList, items: { some: { createdAt: createdInRange } } },
      }),
      prisma.analyticsEvent.findMany({
        where: { eventType: 'START_CHECKOUT', createdAt: createdInRange },
        select: { metadata: true },
      }),
      prisma.payment.count({
        where: { status: 'PAID', createdAt: createdInRange, cart: cartForList },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', createdAt: createdInRange, cart: cartForList },
      }),
      prisma.cartItem.count({
        where: {
          cart: {
            ...cartForList,
            payment: { status: 'PAID', createdAt: createdInRange },
          },
        },
      }),
    ]);

    const registryAttempts = attemptSessions.length;
    const publishedFixed = publishedByPlan.find((row) => row.planType === 'FIXED')?._count ?? 0;
    const publishedCommission = publishedByPlan.find((row) => row.planType === 'COMMISSION')?._count ?? 0;

    // A guest checkout carries `cartId`; a FIXED-plan publish checkout carries
    // `plan` instead. Only the former belongs in the guest funnel. Dedupe by cart
    // so a guest who retries payment three times is still one abandoned checkout.
    const checkoutCartIds = new Set<number>();
    for (const event of checkoutStartEvents) {
      const cartId = Number((event.metadata as { cartId?: unknown } | null)?.cartId);
      if (Number.isInteger(cartId)) checkoutCartIds.add(cartId);
    }
    const checkoutsStarted = weddingListId
      ? await prisma.cart.count({ where: { id: { in: [...checkoutCartIds] }, giftListId: weddingListId } })
      : checkoutCartIds.size;
    const checkoutAbandonments = Math.max(0, checkoutsStarted - giftPurchases);

    return {
      registryAttempts,
      signupsCompleted,
      draftsCreated,
      draftsWithGifts,
      giftsAdded,
      registriesPublished,
      publishedFixed,
      publishedCommission,
      registryViewers,
      cartsWithItems,
      checkoutsStarted,
      giftPurchases,
      giftsSold,
      giftPurchaseAmount: paidAmount._sum.amount ?? 0,
      attemptToSignupRate: pct(signupsCompleted, registryAttempts),
      attemptToDraftRate: pct(draftsCreated, registryAttempts),
      draftActivationRate: pct(draftsWithGifts, draftsCreated),
      draftToPublishRate: pct(registriesPublished, draftsCreated),
      cartToPurchaseRate: pct(giftPurchases, cartsWithItems),
      checkoutCompletionRate: pct(giftPurchases, checkoutsStarted),
      checkoutAbandonments,
      checkoutAbandonmentRate: pct(checkoutAbandonments, checkoutsStarted),
    };
  },

  /**
   * Create or update analytics session
   */
  async upsertSession(params: SessionParams): Promise<void> {
    try {
      const userHash = params.userId ? this.hashUserId(params.userId) : null;

      await prisma.analyticsSession.upsert({
        where: { sessionId: params.sessionId },
        create: {
          sessionId: params.sessionId,
          userHash,
          utmSource: params.utmSource,
          utmMedium: params.utmMedium,
          utmCampaign: params.utmCampaign,
          utmTerm: params.utmTerm,
          utmContent: params.utmContent,
          referrer: params.referrer,
          landingPage: params.landingPage,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
        update: {
          userHash: userHash || undefined,
        },
      });
    } catch (error) {
      console.error('Error upserting analytics session:', error);
    }
  },

  /**
   * Update session page view count
   * Creates session if it doesn't exist
   */
  async incrementSessionPageView(sessionId: string): Promise<void> {
    try {
      // Use upsert to atomically handle both create and update cases
      await prisma.analyticsSession.upsert({
        where: { sessionId },
        create: {
          sessionId,
          pageViews: 1,
        },
        update: {
          pageViews: { increment: 1 },
        },
      });
    } catch (error) {
      console.error('Error incrementing session page view:', error);
    }
  },

  /**
   * End a session and calculate duration
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.analyticsSession.findUnique({
        where: { sessionId },
      });

      if (session) {
        const endedAt = new Date();
        const durationMs = endedAt.getTime() - session.startedAt.getTime();

        await prisma.analyticsSession.update({
          where: { sessionId },
          data: {
            endedAt,
            durationMs,
          },
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  /**
   * Log an analytics event
   */
  async logEvent({ sessionId, eventType, userId, metadata }: LogEventParams): Promise<void> {
    try {
      const userHash = userId ? this.hashUserId(userId) : null;

      await prisma.analyticsEvent.create({
        data: {
          sessionId,
          eventType: eventType as any,
          userHash,
          metadata: metadata || undefined,
        },
      });

      // Increment page view count for PAGE_VIEW events
      if (eventType === 'PAGE_VIEW') {
        await this.incrementSessionPageView(sessionId);
      }
    } catch (error) {
      console.error('Error logging analytics event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  },

  /**
   * Get metrics summary for a date range
   * @param weddingListId Optional wedding list ID to filter by registry owner
   */
  async getMetricsSummary(fromDate: Date, toDate: Date, weddingListId?: number): Promise<MetricsSummary> {
    try {
      // If filtering by wedding list, get the owner's user hash
      let ownerUserHash: string | undefined;
      let registrySlug: string | null = null;
      if (weddingListId) {
        const weddingList = await prisma.giftList.findUnique({
          where: { id: weddingListId },
          select: { userId: true, user: { select: { slug: true } } },
        });
        if (weddingList) {
          ownerUserHash = this.hashUserId(weddingList.userId);
          registrySlug = weddingList.user.slug;
        }
      }

      const conversion = await this.getConversionMetrics(fromDate, toDate, weddingListId, registrySlug);

      // Site-wide unique sessions. Filtering by list uses registry page views
      // instead of the owner's hash — guests buying gifts are not the couple.
      const visitorsResult = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          sessionId: true,
        },
      });
      const visitors = weddingListId ? conversion.registryViewers : visitorsResult.length;

      // Get unique sign-ins (unique userHash with SIGN_IN)
      const signInsResult = await prisma.analyticsEvent.groupBy({
        by: ['userHash'],
        where: {
          eventType: 'SIGN_IN',
          userHash: ownerUserHash || { not: null },
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          userHash: true,
        },
      });
      const signIns = signInsResult.length;

      const registryAttempts = conversion.registryAttempts;
      const draftsCreated = conversion.draftsCreated;
      const registriesPublished = conversion.registriesPublished;
      const giftPurchases = conversion.giftPurchases;

      // Paid-plan publishes still come from the event stream; the product tables
      // don't distinguish a FIXED publish paid this period from one already paid.
      const registryPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_PURCHASE',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
      });

      // Get view pricing count
      const viewPricing = await prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW_PRICING',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
      });

      // Get view registry builder count
      const viewRegistryBuilder = await prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW_REGISTRY_BUILDER',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
      });

      const startCheckouts = conversion.checkoutsStarted;

      // Get checkout errors count
      const checkoutErrors = await prisma.analyticsEvent.count({
        where: {
          eventType: 'CHECKOUT_ERROR',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
      });

      const checkoutAbandonments = conversion.checkoutAbandonments;

      // Get session metrics
      const sessions = await prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
        select: {
          pageViews: true,
          durationMs: true,
        },
      });

      const avgPagesPerSession = sessions.length > 0 ? sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0) / sessions.length : 0;

      const sessionsWithDuration = sessions.filter((s: any) => s.durationMs !== null);
      const avgSessionDurationMs =
        sessionsWithDuration.length > 0
          ? sessionsWithDuration.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0) / sessionsWithDuration.length
          : 0;

      // Calculate conversion rates
      const signInRate = pct(signIns, visitors);
      const registryPurchaseRate = pct(registryPurchases, signIns);
      const giftPurchaseRate = conversion.cartToPurchaseRate;
      const checkoutAbandonmentRate = conversion.checkoutAbandonmentRate;
      const draftToPublishRate = conversion.draftToPublishRate;

      // Get top UTM sources
      const utmSourceSessions = await prisma.analyticsSession.groupBy({
        by: ['utmSource'],
        where: {
          utmSource: { not: null },
          startedAt: {
            gte: fromDate,
            lte: toDate,
          },
          ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
        },
        _count: {
          sessionId: true,
        },
      });

      const topUtmSources = await Promise.all(
        utmSourceSessions.slice(0, 5).map(async (item: any) => {
          const conversions = await prisma.analyticsEvent.count({
            where: {
              eventType: { in: ['REGISTRY_PURCHASE', 'GIFT_PURCHASE'] },
              sessionId: {
                in: (
                  await prisma.analyticsSession.findMany({
                    where: {
                      utmSource: item.utmSource,
                      startedAt: { gte: fromDate, lte: toDate },
                      ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
                    },
                    select: { sessionId: true },
                  })
                ).map((s: any) => s.sessionId),
              },
              createdAt: { gte: fromDate, lte: toDate },
              ...(ownerUserHash ? { userHash: ownerUserHash } : {}),
            },
          });

          return {
            source: item.utmSource || 'unknown',
            visitors: item._count.sessionId,
            conversions,
            conversionRate: item._count.sessionId > 0 ? (conversions / item._count.sessionId) * 100 : 0,
          };
        }),
      );

      return {
        visitors,
        signIns,
        registryAttempts,
        registryPurchases,
        signupsCompleted: conversion.signupsCompleted,
        draftsCreated,
        draftsWithGifts: conversion.draftsWithGifts,
        giftsAdded: conversion.giftsAdded,
        registriesPublished,
        publishedFixed: conversion.publishedFixed,
        publishedCommission: conversion.publishedCommission,
        registryViewers: conversion.registryViewers,
        cartsWithItems: conversion.cartsWithItems,
        giftPurchases,
        giftsSold: conversion.giftsSold,
        giftPurchaseAmount: conversion.giftPurchaseAmount,
        viewPricing,
        viewRegistryBuilder,
        startCheckouts,
        checkoutErrors,
        checkoutAbandonments,
        avgPagesPerSession: Math.round(avgPagesPerSession * 100) / 100,
        avgSessionDurationMs: Math.round(avgSessionDurationMs),
        signInRate,
        registryPurchaseRate,
        attemptToSignupRate: conversion.attemptToSignupRate,
        attemptToDraftRate: conversion.attemptToDraftRate,
        draftActivationRate: conversion.draftActivationRate,
        draftToPublishRate,
        cartToPurchaseRate: conversion.cartToPurchaseRate,
        checkoutCompletionRate: conversion.checkoutCompletionRate,
        giftPurchaseRate,
        checkoutAbandonmentRate,
        topUtmSources,
      };
    } catch (error) {
      console.error('Error getting metrics summary:', error);
      throw new Error('Failed to get metrics summary');
    }
  },

  /**
   * Get time series data for a specific metric
   */
  async getTimeSeries(
    metric:
      | 'visitors'
      | 'signIns'
      | 'registryAttempts'
      | 'registryPurchases'
      | 'signupsCompleted'
      | 'draftsCreated'
      | 'giftsAdded'
      | 'registriesPublished'
      | 'cartsWithItems'
      | 'giftPurchases'
      | 'viewPricing'
      | 'viewRegistryBuilder'
      | 'startCheckouts',
    fromDate: Date,
    toDate: Date,
    granularity: 'daily' | 'hourly' = 'daily',
  ): Promise<TimeSeriesData[]> {
    try {
      // Metrics the summary cards read off the product tables have to trend off
      // the same tables, or the chart and the card above it disagree.
      const productSeries = PRODUCT_TIME_SERIES[metric as ProductSeriesMetric];
      if (productSeries) {
        return await countByDay(productSeries, fromDate, toDate);
      }

      if (granularity === 'daily') {
        // Use aggregated daily data if available
        const dailyData = await prisma.analyticsDaily.findMany({
          where: {
            date: {
              gte: fromDate,
              lte: toDate,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        return dailyData.map((day: any) => ({
          date: day.date.toISOString().split('T')[0],
          value: day[metric],
        }));
      } else {
        // For hourly, query raw events (more expensive)
        // This is a simplified version - you might want to optimize this
        const eventTypeMap: Record<string, string> = {
          visitors: 'PAGE_VIEW',
          signIns: 'SIGN_IN',
          registryAttempts: 'REGISTRY_ATTEMPT',
          registryPurchases: 'REGISTRY_PURCHASE',
          draftsCreated: 'REGISTRY_DRAFT_CREATED',
          registriesPublished: 'REGISTRY_PUBLISHED',
          giftPurchases: 'GIFT_PURCHASE',
          viewPricing: 'VIEW_PRICING',
          viewRegistryBuilder: 'VIEW_REGISTRY_BUILDER',
          startCheckouts: 'START_CHECKOUT',
        };

        const events = await prisma.analyticsEvent.findMany({
          where: {
            eventType: eventTypeMap[metric] as any,
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
          select: {
            createdAt: true,
            sessionId: true,
            userHash: true,
          },
        });

        // Group by hour
        const hourlyMap = new Map<string, Set<string>>();
        events.forEach((event: any) => {
          const hour = new Date(event.createdAt);
          hour.setMinutes(0, 0, 0);
          const hourKey = hour.toISOString();

          if (!hourlyMap.has(hourKey)) {
            hourlyMap.set(hourKey, new Set());
          }

          // For visitors/signIns, count unique sessions/users
          if (metric === 'visitors') {
            hourlyMap.get(hourKey)!.add(event.sessionId);
          } else if (metric === 'signIns' && event.userHash) {
            hourlyMap.get(hourKey)!.add(event.userHash);
          } else {
            // For purchases, just count events
            hourlyMap.get(hourKey)!.add(event.createdAt.toISOString());
          }
        });

        return Array.from(hourlyMap.entries())
          .map(([date, set]) => ({
            date,
            value: set.size,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch (error) {
      console.error('Error getting time series:', error);
      throw new Error('Failed to get time series data');
    }
  },

  /**
   * Aggregate daily metrics (to be run as a cron job)
   */
  async aggregateDailyMetrics(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get unique visitors
      const visitorsResult = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const visitors = visitorsResult.length;

      // Get unique sign-ins
      const signInsResult = await prisma.analyticsEvent.groupBy({
        by: ['userHash'],
        where: {
          eventType: 'SIGN_IN',
          userHash: { not: null },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const signIns = signInsResult.length;

      // Get registry purchases
      const registryPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_PURCHASE',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Free-to-build funnel: drafts started vs. drafts that went live.
      const draftsCreated = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_DRAFT_CREATED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const registriesPublished = await prisma.analyticsEvent.count({
        where: {
          eventType: 'REGISTRY_PUBLISHED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get gift purchases
      const giftPurchases = await prisma.analyticsEvent.count({
        where: {
          eventType: 'GIFT_PURCHASE',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get view pricing
      const viewPricing = await prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW_PRICING',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get view registry builder
      const viewRegistryBuilder = await prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW_REGISTRY_BUILDER',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get start checkouts
      const startCheckouts = await prisma.analyticsEvent.count({
        where: {
          eventType: 'START_CHECKOUT',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Get checkout errors
      const checkoutErrors = await prisma.analyticsEvent.count({
        where: {
          eventType: 'CHECKOUT_ERROR',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Calculate checkout abandonments
      const totalPurchases = registryPurchases + giftPurchases;
      const checkoutAbandonments = Math.max(0, startCheckouts - totalPurchases);

      // Get session metrics
      const sessions = await prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          pageViews: true,
          durationMs: true,
        },
      });

      const avgPagesPerSession = sessions.length > 0 ? sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0) / sessions.length : 0;

      const sessionsWithDuration = sessions.filter((s: any) => s.durationMs !== null);
      const avgSessionDurationMs =
        sessionsWithDuration.length > 0
          ? sessionsWithDuration.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0) / sessionsWithDuration.length
          : 0;

      // Upsert daily aggregate
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      await prisma.analyticsDaily.upsert({
        where: {
          date: dateOnly,
        },
        create: {
          date: dateOnly,
          visitors,
          signIns,
          registryPurchases,
          draftsCreated,
          registriesPublished,
          giftPurchases,
          viewPricing,
          viewRegistryBuilder,
          startCheckouts,
          checkoutErrors,
          checkoutAbandonments,
          avgPagesPerSession,
          avgSessionDurationMs,
        },
        update: {
          visitors,
          signIns,
          registryPurchases,
          draftsCreated,
          registriesPublished,
          giftPurchases,
          viewPricing,
          viewRegistryBuilder,
          startCheckouts,
          checkoutErrors,
          checkoutAbandonments,
          avgPagesPerSession,
          avgSessionDurationMs,
        },
      });

      console.log(`Aggregated metrics for ${dateOnly.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error aggregating daily metrics:', error);
      throw new Error('Failed to aggregate daily metrics');
    }
  },

  /**
   * Clean up old events (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Deleted ${result.count} old analytics events`);
    } catch (error) {
      console.error('Error cleaning up old events:', error);
      throw new Error('Failed to cleanup old events');
    }
  },

  /**
   * Clean up old daily aggregates (retention policy)
   */
  async cleanupOldAggregates(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.analyticsDaily.deleteMany({
        where: {
          date: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Deleted ${result.count} old daily aggregates`);
    } catch (error) {
      console.error('Error cleaning up old aggregates:', error);
      throw new Error('Failed to cleanup old aggregates');
    }
  },

  /**
   * Clean up old sessions (retention policy)
   */
  async cleanupOldSessions(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.analyticsSession.deleteMany({
        where: {
          startedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Deleted ${result.count} old analytics sessions`);
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      throw new Error('Failed to cleanup old sessions');
    }
  },

  /**
   * Get funnel breakdown by dimension (utm_source or landing_page)
   */
  async getFunnelBreakdown(dimension: 'utm_source' | 'landing_page', fromDate: Date, toDate: Date): Promise<FunnelBreakdown[]> {
    try {
      const field = dimension === 'utm_source' ? 'utmSource' : 'landingPage';

      // Get all unique values for the dimension
      const sessions = await prisma.analyticsSession.groupBy({
        by: [field],
        where: {
          [field]: { not: null },
          startedAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          sessionId: true,
        },
      });

      const breakdowns = await Promise.all(
        sessions.map(async (item: any) => {
          const dimensionValue = item[field] || 'unknown';

          // Get session IDs for this dimension value
          const sessionIds = (
            await prisma.analyticsSession.findMany({
              where: {
                [field]: dimensionValue,
                startedAt: { gte: fromDate, lte: toDate },
              },
              select: { sessionId: true },
            })
          ).map((s: any) => s.sessionId);

          // Count visitors (unique sessions)
          const visitors = sessionIds.length;

          // Count sign-ins
          const signIns = await prisma.analyticsEvent.count({
            where: {
              eventType: 'SIGN_IN',
              sessionId: { in: sessionIds },
              createdAt: { gte: fromDate, lte: toDate },
            },
          });

          // Count start checkouts
          const startCheckouts = await prisma.analyticsEvent.count({
            where: {
              eventType: 'START_CHECKOUT',
              sessionId: { in: sessionIds },
              createdAt: { gte: fromDate, lte: toDate },
            },
          });

          // Count purchases
          const purchases = await prisma.analyticsEvent.count({
            where: {
              eventType: { in: ['REGISTRY_PURCHASE', 'GIFT_PURCHASE'] },
              sessionId: { in: sessionIds },
              createdAt: { gte: fromDate, lte: toDate },
            },
          });

          // Calculate abandonments
          const checkoutAbandonments = Math.max(0, startCheckouts - purchases);

          // Calculate rates
          const signInRate = visitors > 0 ? (signIns / visitors) * 100 : 0;
          const checkoutRate = signIns > 0 ? (startCheckouts / signIns) * 100 : 0;
          const purchaseRate = startCheckouts > 0 ? (purchases / startCheckouts) * 100 : 0;
          const abandonmentRate = startCheckouts > 0 ? (checkoutAbandonments / startCheckouts) * 100 : 0;

          return {
            group: dimensionValue,
            visitors,
            signIns,
            startCheckouts,
            purchases,
            checkoutAbandonments,
            signInRate: Math.round(signInRate * 100) / 100,
            checkoutRate: Math.round(checkoutRate * 100) / 100,
            purchaseRate: Math.round(purchaseRate * 100) / 100,
            abandonmentRate: Math.round(abandonmentRate * 100) / 100,
          };
        }),
      );

      // Sort by visitors descending
      return breakdowns.sort((a, b) => b.visitors - a.visitors);
    } catch (error) {
      console.error('Error getting funnel breakdown:', error);
      throw new Error('Failed to get funnel breakdown');
    }
  },

  /**
   * Delete user analytics data (GDPR compliance)
   */
  async deleteUserAnalytics(userId: number): Promise<void> {
    try {
      const userHash = this.hashUserId(userId);

      // Delete events
      const eventsDeleted = await prisma.analyticsEvent.deleteMany({
        where: { userHash },
      });

      // Delete sessions
      const sessionsDeleted = await prisma.analyticsSession.deleteMany({
        where: { userHash },
      });

      console.log(`Deleted ${eventsDeleted.count} events and ${sessionsDeleted.count} sessions for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user analytics:', error);
      throw new Error('Failed to delete user analytics data');
    }
  },

  /**
   * Check for metric anomalies (for alerting)
   */
  async checkMetricAnomalies(): Promise<{
    alerts: Array<{ metric: string; message: string; severity: 'warning' | 'critical' }>;
  }> {
    try {
      const alerts: Array<{ metric: string; message: string; severity: 'warning' | 'critical' }> = [];

      // Get today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayData = await prisma.analyticsDaily.findUnique({
        where: { date: today },
      });

      const yesterdayData = await prisma.analyticsDaily.findUnique({
        where: { date: yesterday },
      });

      if (!todayData || !yesterdayData) {
        return { alerts };
      }

      // Check for >30% drop in registry purchases
      if (yesterdayData.registryPurchases > 0) {
        const purchaseChange = ((todayData.registryPurchases - yesterdayData.registryPurchases) / yesterdayData.registryPurchases) * 100;
        if (purchaseChange < -30) {
          alerts.push({
            metric: 'registry_purchases',
            message: `Registry purchases dropped by ${Math.abs(purchaseChange).toFixed(1)}% (${yesterdayData.registryPurchases} → ${todayData.registryPurchases})`,
            severity: 'critical',
          });
        }
      }

      // Check for >30% drop in sign-ins
      if (yesterdayData.signIns > 0) {
        const signInChange = ((todayData.signIns - yesterdayData.signIns) / yesterdayData.signIns) * 100;
        if (signInChange < -30) {
          alerts.push({
            metric: 'sign_ins',
            message: `Sign-ins dropped by ${Math.abs(signInChange).toFixed(1)}% (${yesterdayData.signIns} → ${todayData.signIns})`,
            severity: 'critical',
          });
        }
      }

      // Check for spike in checkout errors (>10 in a day)
      if (todayData.checkoutErrors > 10) {
        alerts.push({
          metric: 'checkout_errors',
          message: `High number of checkout errors: ${todayData.checkoutErrors}`,
          severity: 'warning',
        });
      }

      // Check for increased abandonment rate (>50%)
      if (todayData.startCheckouts > 0) {
        const abandonmentRate = (todayData.checkoutAbandonments / todayData.startCheckouts) * 100;
        if (abandonmentRate > 50) {
          alerts.push({
            metric: 'checkout_abandonment',
            message: `High checkout abandonment rate: ${abandonmentRate.toFixed(1)}% (${todayData.checkoutAbandonments} of ${todayData.startCheckouts})`,
            severity: 'warning',
          });
        }
      }

      return { alerts };
    } catch (error) {
      console.error('Error checking metric anomalies:', error);
      return { alerts: [] };
    }
  },
};

export default analyticsService;
