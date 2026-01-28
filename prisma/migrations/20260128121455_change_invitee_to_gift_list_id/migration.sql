/*
  Warnings:

  - You are about to drop the column `couple_id` on the `invitees` table. All the data in the column will be lost.
  - Added the required column `gift_list_id` to the `invitees` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the new column as nullable first
ALTER TABLE "invitees" ADD COLUMN "gift_list_id" INTEGER;

-- Step 2: Migrate data from couple_id to gift_list_id
-- Map each invitee to the first gift list of their couple
UPDATE "invitees" 
SET "gift_list_id" = (
  SELECT "id" 
  FROM "gift_lists" 
  WHERE "gift_lists"."user_id" = "invitees"."couple_id" 
  ORDER BY "gift_lists"."created_at" ASC 
  LIMIT 1
);

-- Step 3: Make the column NOT NULL now that data is migrated
ALTER TABLE "invitees" ALTER COLUMN "gift_list_id" SET NOT NULL;

-- Step 4: Drop the old couple_id column and index
DROP INDEX "invitees_couple_id_idx";
ALTER TABLE "invitees" DROP COLUMN "couple_id";

-- Step 5: Create new index
CREATE INDEX "invitees_gift_list_id_idx" ON "invitees"("gift_list_id");

-- Step 6: Add foreign key constraint
ALTER TABLE "invitees" ADD CONSTRAINT "invitees_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
