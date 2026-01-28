/*
  Warnings:

  - You are about to drop the column `slug` on the `invitations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "invitations_slug_idx";

-- DropIndex
DROP INDEX "invitations_slug_key";

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "slug";
