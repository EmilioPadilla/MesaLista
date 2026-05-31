/* eslint-disable no-console */
// CLI: retry payment-confirmation emails that failed during the webhook (Postmark
// glitch, transient network error, etc). Webhooks persist outcomes on
// Payment.emailDeliveryStatus instead of throwing, so this script is the recovery
// path. Run with:
//   tsx server/scripts/retryFailedEmails.ts          # retry all FAILED
//   tsx server/scripts/retryFailedEmails.ts --cartId=123   # retry one cart
//   tsx server/scripts/retryFailedEmails.ts --max-attempts=5  # skip rows tried 5+ times

import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService.js';
import { recordEmailDelivery } from '../controllers/paymentController.js';

const prisma = new PrismaClient();

const parseArgs = () => {
  const args = process.argv.slice(2);
  let cartId: number | undefined;
  let maxAttempts: number | undefined;
  for (const arg of args) {
    if (arg.startsWith('--cartId=')) cartId = parseInt(arg.slice('--cartId='.length), 10);
    else if (arg.startsWith('--max-attempts=')) maxAttempts = parseInt(arg.slice('--max-attempts='.length), 10);
  }
  return { cartId, maxAttempts };
};

async function main() {
  const { cartId, maxAttempts } = parseArgs();

  const where: any = { emailDeliveryStatus: 'FAILED' };
  if (cartId) where.cartId = cartId;
  if (maxAttempts) where.emailDeliveryAttempts = { lt: maxAttempts };

  const candidates = await prisma.payment.findMany({
    where,
    select: { cartId: true, emailDeliveryAttempts: true },
    orderBy: { emailDeliveryLastAttemptAt: 'asc' },
  });

  if (candidates.length === 0) {
    console.log('No failed-email payments to retry.');
    return;
  }

  console.log(`Retrying ${candidates.length} payment email(s)...`);
  let sent = 0;
  let stillFailing = 0;

  for (const p of candidates) {
    await recordEmailDelivery(p.cartId, () => emailService.sendPaymentEmails(p.cartId));
    const after = await prisma.payment.findFirst({
      where: { cartId: p.cartId },
      select: { emailDeliveryStatus: true },
    });
    if (after?.emailDeliveryStatus === 'SENT') {
      sent++;
      console.log(`  ✓ cart ${p.cartId} (was attempt ${p.emailDeliveryAttempts})`);
    } else {
      stillFailing++;
      console.log(`  ✗ cart ${p.cartId} still FAILED`);
    }
  }

  console.log(`Done: ${sent} sent, ${stillFailing} still failing.`);
}

main()
  .catch((err) => {
    console.error('Retry script failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
