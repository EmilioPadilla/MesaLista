-- CreateTable
CREATE TABLE "pending_plan_signups" (
    "id" TEXT NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "spouse_first_name" TEXT,
    "spouse_last_name" TEXT,
    "phone_number" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "event_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_plan_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_plan_signups_app_user_id_key" ON "pending_plan_signups"("app_user_id");
