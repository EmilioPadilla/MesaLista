/*
  Warnings:

  - You are about to drop the column `slug` on the `gift_lists` table. All the data in the column will be lost.
  - You are about to drop the column `coupleSlug` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "gift_lists_slug_idx";

-- DropIndex
DROP INDEX "gift_lists_slug_key";

-- DropIndex
DROP INDEX "users_coupleSlug_key";

-- AlterTable
ALTER TABLE "gift_lists" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "coupleSlug",
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");
