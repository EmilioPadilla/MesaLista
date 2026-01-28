-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "gift_list_id" INTEGER;

-- CreateIndex
CREATE INDEX "carts_gift_list_id_idx" ON "carts"("gift_list_id");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
