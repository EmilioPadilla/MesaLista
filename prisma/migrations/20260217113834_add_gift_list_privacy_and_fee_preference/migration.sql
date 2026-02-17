-- AlterTable
ALTER TABLE "gift_lists" ADD COLUMN     "fee_preference" TEXT NOT NULL DEFAULT 'couple',
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true;
