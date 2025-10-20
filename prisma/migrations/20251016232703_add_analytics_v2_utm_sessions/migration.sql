-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'VIEW_PRICING';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'VIEW_REGISTRY_BUILDER';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'START_CHECKOUT';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CHECKOUT_ERROR';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_START';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_END';

-- AlterTable
ALTER TABLE "analytics_daily" ADD COLUMN     "avg_pages_per_session" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "avg_session_duration_ms" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "checkout_abandonments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "checkout_errors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start_checkouts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "view_pricing" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "view_registry_builder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_hash" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "referrer" TEXT,
    "landing_page" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_hourly" (
    "id" SERIAL NOT NULL,
    "hour" TIMESTAMPTZ NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "sign_ins" INTEGER NOT NULL DEFAULT 0,
    "registry_purchases" INTEGER NOT NULL DEFAULT 0,
    "gift_purchases" INTEGER NOT NULL DEFAULT 0,
    "view_pricing" INTEGER NOT NULL DEFAULT 0,
    "view_registry_builder" INTEGER NOT NULL DEFAULT 0,
    "start_checkouts" INTEGER NOT NULL DEFAULT 0,
    "checkout_errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_sessions_session_id_key" ON "analytics_sessions"("session_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_session_id_idx" ON "analytics_sessions"("session_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_utm_source_started_at_idx" ON "analytics_sessions"("utm_source", "started_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_landing_page_started_at_idx" ON "analytics_sessions"("landing_page", "started_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_started_at_idx" ON "analytics_sessions"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_hourly_hour_key" ON "analytics_hourly"("hour");

-- CreateIndex
CREATE INDEX "analytics_hourly_hour_idx" ON "analytics_hourly"("hour");
