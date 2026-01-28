/*
  Warnings:

  - You are about to drop the column `couple_id` on the `rsvp_messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gift_list_id]` on the table `rsvp_messages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gift_list_id` to the `rsvp_messages` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the new column as nullable first
ALTER TABLE "rsvp_messages" ADD COLUMN "gift_list_id" INTEGER;

-- Step 2: Migrate data from couple_id to gift_list_id
-- Map each rsvp_message to the first gift list of the couple (user)
UPDATE "rsvp_messages" 
SET "gift_list_id" = (
  SELECT "id" 
  FROM "gift_lists" 
  WHERE "gift_lists"."user_id" = "rsvp_messages"."couple_id" 
  ORDER BY "gift_lists"."created_at" ASC 
  LIMIT 1
);

-- Step 3: Make the column NOT NULL now that data is migrated
ALTER TABLE "rsvp_messages" ALTER COLUMN "gift_list_id" SET NOT NULL;

-- Step 4: Drop old indexes and column
DROP INDEX "rsvp_messages_couple_id_idx";
DROP INDEX "rsvp_messages_couple_id_key";
ALTER TABLE "rsvp_messages" DROP COLUMN "couple_id";

-- Step 5: Create new indexes
CREATE UNIQUE INDEX "rsvp_messages_gift_list_id_key" ON "rsvp_messages"("gift_list_id");
CREATE INDEX "rsvp_messages_gift_list_id_idx" ON "rsvp_messages"("gift_list_id");

-- Step 6: Add foreign key constraint
ALTER TABLE "rsvp_messages" ADD CONSTRAINT "rsvp_messages_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
