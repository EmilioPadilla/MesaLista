-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "net_amount" DOUBLE PRECISION,
ADD COLUMN     "fee_source" TEXT;
