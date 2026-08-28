-- Group gifts: several guests can now fund one gift together.
--
-- Two variants sit alongside the original single-buyer gift, which is unchanged
-- and remains the default:
--   GROUP_FIXED — the couple splits the gift into N equal shares (3 friends split
--                 one gift); a share costs price / contributor_target.
--   GROUP_OPEN  — any guest chips in any amount until the goal is reached.
--
-- `price` doubles as the funding GOAL for both group variants rather than getting a
-- second amount column. Every existing read — price sorting, min/max filters, the
-- couple's "valor total" stat, the publish-readiness check — keeps working, and the
-- couple only ever thinks about one number.
CREATE TYPE "GiftType" AS ENUM ('SINGLE', 'GROUP_FIXED', 'GROUP_OPEN');

-- DEFAULT 'SINGLE' + NOT NULL backfills every existing gift into the old behaviour
-- in one statement, so no data migration is needed.
ALTER TABLE "gifts" ADD COLUMN "gift_type" "GiftType" NOT NULL DEFAULT 'SINGLE';

-- GROUP_FIXED only: how many equal shares the gift is split into.
ALTER TABLE "gifts" ADD COLUMN "contributor_target" INTEGER;

-- GROUP_OPEN only: the smallest amount a guest may chip in. NULL means "use the
-- platform floor" so the couple can leave it alone.
ALTER TABLE "gifts" ADD COLUMN "min_contribution" DOUBLE PRECISION;

-- Denormalised funding progress. Guests see a progress meter on every card in the
-- grid, so deriving this would mean joining paid carts on every registry read. The
-- payment webhook / PayPal capture is the single writer.
ALTER TABLE "gifts" ADD COLUMN "amount_funded" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "gifts" ADD COLUMN "contributor_count" INTEGER NOT NULL DEFAULT 0;

-- Existing bought gifts are single-buyer and fully settled. Stating that explicitly
-- keeps "amount funded" truthful if a couple ever converts a gift's type later, and
-- makes the two columns consistent with is_purchased from day one.
UPDATE "gifts" SET "amount_funded" = "price", "contributor_count" = 1 WHERE "isPurchased" = true;

-- Guests browsing a published registry filter on funded-vs-open constantly; the
-- registry read is the hottest query in the app.
CREATE INDEX "gifts_gift_list_id_gift_type_idx" ON "gifts"("gift_list_id", "gift_type");
