-- CreateTable
CREATE TABLE "signup_emails" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'signup',
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "converted_to_user" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signup_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signup_emails_email_key" ON "signup_emails"("email");

-- CreateIndex
CREATE INDEX "signup_emails_email_idx" ON "signup_emails"("email");

-- CreateIndex
CREATE INDEX "signup_emails_source_idx" ON "signup_emails"("source");
