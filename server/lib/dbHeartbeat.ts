import type { PrismaClient } from '@prisma/client';

/**
 * Single DB keep-alive ping, run on an interval from index.ts.
 *
 * It runs from a timer, so nothing upstream awaits it: a rejection here would
 * become an unhandled promise rejection. A failed ping (e.g. the database is
 * briefly unreachable during a Railway restart) is logged and the next tick
 * retries; Prisma reconnects on its own once the database is back.
 */
export async function runDbHeartbeat(client: Pick<PrismaClient, '$queryRaw'>): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    console.log('💓 DB heartbeat');
    return true;
  } catch (error: any) {
    console.warn('⚠️ DB heartbeat failed, will retry on next tick:', error?.message ?? error);
    return false;
  }
}
