-- Introduces the DRAFT state for gift lists.
--
-- Couples now build a registry for free and choose a plan at publish time, so a
-- list with no plan is a draft: invisible to guests, unable to receive money.
-- `published_at` makes that transition explicit and gives the funnel a
-- draft -> publish timestamp to measure.
ALTER TABLE "gift_lists" ADD COLUMN "published_at" TIMESTAMP(3);

-- Every list that already has a plan is live and MUST stay live. Without this
-- backfill the read gating added alongside it would unpublish production.
-- `created_at` is the closest truthful value: under the old flow a list was
-- created only after its plan was chosen and paid for.
UPDATE "gift_lists" SET "published_at" = "created_at" WHERE "plan_type" IS NOT NULL;

CREATE INDEX "gift_lists_published_at_idx" ON "gift_lists"("published_at");

-- Pending IAP rows gain an UPGRADE mode: the couple already has an account and a
-- draft list, so there is no signup payload to stash — just who is buying and
-- which list the purchase publishes.
ALTER TABLE "pending_plan_signups" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "pending_plan_signups" ADD COLUMN "gift_list_id" INTEGER;

-- Signup columns become optional so an UPGRADE row can omit them. They stay in
-- place (nullable) only to keep serving App Store builds <= 1.0.2 (18), which
-- still pay before the account exists.
ALTER TABLE "pending_plan_signups" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "pending_plan_signups" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "pending_plan_signups" ALTER COLUMN "first_name" DROP NOT NULL;
ALTER TABLE "pending_plan_signups" ALTER COLUMN "last_name" DROP NOT NULL;
ALTER TABLE "pending_plan_signups" ALTER COLUMN "slug" DROP NOT NULL;

-- Free-to-build funnel counters. Signup and payment used to be the same step, so
-- `registry_purchases` measured both; these split them so the draft -> publish
-- rate can be read off the daily/hourly rollups.
ALTER TABLE "analytics_daily" ADD COLUMN "drafts_created" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "analytics_daily" ADD COLUMN "registries_published" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "analytics_hourly" ADD COLUMN "drafts_created" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "analytics_hourly" ADD COLUMN "registries_published" INTEGER NOT NULL DEFAULT 0;

-- New funnel event types. Postgres requires each ADD VALUE in its own statement
-- and they cannot run inside a transaction block with other DDL in older
-- versions, so keep them last.
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'REGISTRY_DRAFT_CREATED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'REGISTRY_PUBLISHED';
