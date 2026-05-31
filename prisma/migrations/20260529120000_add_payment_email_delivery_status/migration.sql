-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "payments"
ADD COLUMN     "email_delivery_status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "email_delivery_error" TEXT,
ADD COLUMN     "email_delivery_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email_delivery_last_attempt_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "payments_email_delivery_status_idx" ON "payments"("email_delivery_status");
