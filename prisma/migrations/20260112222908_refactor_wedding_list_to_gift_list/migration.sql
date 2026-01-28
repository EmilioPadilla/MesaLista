/*
  Warnings:

  - You are about to drop the column `wedding_list_id` on the `gift_categories_on_gifts` table. All the data in the column will be lost.
  - You are about to drop the column `wedding_list_id` on the `gifts` table. All the data in the column will be lost.
  - You are about to drop the column `discount_code_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `plan_type` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `wedding_lists` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gift_list_id` to the `gift_categories_on_gifts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gift_list_id` to the `gifts` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Create the new gift_lists table
CREATE TABLE "gift_lists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coupleName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "invitationCount" INTEGER NOT NULL DEFAULT 0,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_location" TEXT,
    "event_venue" TEXT,
    "image_url" TEXT,
    "plan_type" "PlanType",
    "discount_code_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_lists_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate data from wedding_lists to gift_lists
-- Copy data and use couple_id as user_id, generate slug from coupleName
INSERT INTO "gift_lists" (
    "id",
    "user_id",
    "title",
    "description",
    "coupleName",
    "slug",
    "invitationCount",
    "event_date",
    "event_location",
    "event_venue",
    "image_url",
    "plan_type",
    "discount_code_id",
    "created_at",
    "updated_at"
)
SELECT 
    wl."id",
    wl."couple_id" as "user_id",
    wl."title",
    wl."description",
    wl."coupleName",
    COALESCE(u."coupleSlug", LOWER(REGEXP_REPLACE(wl."coupleName", '[^a-zA-Z0-9]+', '-', 'g'))) as "slug",
    wl."invitationCount",
    wl."weddingDate" as "event_date",
    wl."weddingLocation" as "event_location",
    wl."weddingVenue" as "event_venue",
    wl."imageUrl" as "image_url",
    u."plan_type",
    u."discount_code_id",
    wl."created_at",
    wl."updated_at"
FROM "wedding_lists" wl
LEFT JOIN "users" u ON wl."couple_id" = u."id";

-- Step 3: Update sequence for gift_lists id
SELECT setval(pg_get_serial_sequence('gift_lists', 'id'), COALESCE(MAX(id), 1)) FROM "gift_lists";

-- Step 4: Add gift_list_id column to gifts table (temporarily nullable)
ALTER TABLE "gifts" ADD COLUMN "gift_list_id" INTEGER;

-- Step 5: Migrate gift_list_id data (wedding_list_id -> gift_list_id with same ID)
UPDATE "gifts" SET "gift_list_id" = "wedding_list_id";

-- Step 6: Make gift_list_id NOT NULL
ALTER TABLE "gifts" ALTER COLUMN "gift_list_id" SET NOT NULL;

-- Step 7: Add gift_list_id column to gift_categories_on_gifts table (temporarily nullable)
ALTER TABLE "gift_categories_on_gifts" ADD COLUMN "gift_list_id" INTEGER;

-- Step 8: Migrate gift_list_id data
UPDATE "gift_categories_on_gifts" SET "gift_list_id" = "wedding_list_id";

-- Step 9: Make gift_list_id NOT NULL
ALTER TABLE "gift_categories_on_gifts" ALTER COLUMN "gift_list_id" SET NOT NULL;

-- Step 10: Drop old foreign key constraints
ALTER TABLE "gift_categories_on_gifts" DROP CONSTRAINT "gift_categories_on_gifts_wedding_list_id_fkey";
ALTER TABLE "gifts" DROP CONSTRAINT "gifts_wedding_list_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT "users_discount_code_id_fkey";
ALTER TABLE "wedding_lists" DROP CONSTRAINT "wedding_lists_couple_id_fkey";

-- Step 11: Drop old columns
ALTER TABLE "gift_categories_on_gifts" DROP COLUMN "wedding_list_id";
ALTER TABLE "gifts" DROP COLUMN "wedding_list_id";
ALTER TABLE "users" DROP COLUMN "discount_code_id";
ALTER TABLE "users" DROP COLUMN "plan_type";

-- Step 12: Drop old wedding_lists table
DROP TABLE "wedding_lists";

-- Step 13: Create indexes on gift_lists
CREATE UNIQUE INDEX "gift_lists_slug_key" ON "gift_lists"("slug");
CREATE INDEX "gift_lists_user_id_idx" ON "gift_lists"("user_id");
CREATE INDEX "gift_lists_slug_idx" ON "gift_lists"("slug");

-- Step 14: Add foreign key constraints
ALTER TABLE "gift_lists" ADD CONSTRAINT "gift_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_lists" ADD CONSTRAINT "gift_lists_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_categories_on_gifts" ADD CONSTRAINT "gift_categories_on_gifts_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
