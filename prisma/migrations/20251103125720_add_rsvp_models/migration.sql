-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "invitees" (
    "id" TEXT NOT NULL,
    "couple_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "tickets" INTEGER NOT NULL DEFAULT 1,
    "secret_code" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_tickets" INTEGER,
    "guest_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "invitees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_messages" (
    "id" SERIAL NOT NULL,
    "couple_id" INTEGER NOT NULL,
    "confirmation_message" TEXT NOT NULL DEFAULT '¡Gracias por confirmar tu asistencia! Nos encantará verte en nuestra boda.',
    "cancellation_message" TEXT NOT NULL DEFAULT 'Lamentamos que no puedas asistir. ¡Gracias por avisarnos!',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitees_secret_code_key" ON "invitees"("secret_code");

-- CreateIndex
CREATE INDEX "invitees_couple_id_idx" ON "invitees"("couple_id");

-- CreateIndex
CREATE INDEX "invitees_secret_code_idx" ON "invitees"("secret_code");

-- CreateIndex
CREATE INDEX "invitees_status_idx" ON "invitees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_messages_couple_id_key" ON "rsvp_messages"("couple_id");

-- CreateIndex
CREATE INDEX "rsvp_messages_couple_id_idx" ON "rsvp_messages"("couple_id");
