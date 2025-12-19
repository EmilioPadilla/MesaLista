-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('DELIVERY', 'BOUNCE', 'SPAM_COMPLAINT', 'OPEN', 'LINK_CLICK');

-- CreateTable
CREATE TABLE "email_analytics" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "event_type" "EmailEventType" NOT NULL,
    "tag" TEXT,
    "metadata" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_analytics_daily" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "spam_complaints" INTEGER NOT NULL DEFAULT 0,
    "delivery_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "open_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "click_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_analytics_message_id_key" ON "email_analytics"("message_id");

-- CreateIndex
CREATE INDEX "email_analytics_event_type_recorded_at_idx" ON "email_analytics"("event_type", "recorded_at");

-- CreateIndex
CREATE INDEX "email_analytics_recipient_recorded_at_idx" ON "email_analytics"("recipient", "recorded_at");

-- CreateIndex
CREATE INDEX "email_analytics_tag_recorded_at_idx" ON "email_analytics"("tag", "recorded_at");

-- CreateIndex
CREATE INDEX "email_analytics_recorded_at_idx" ON "email_analytics"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_analytics_daily_date_key" ON "email_analytics_daily"("date");

-- CreateIndex
CREATE INDEX "email_analytics_daily_date_idx" ON "email_analytics_daily"("date");
