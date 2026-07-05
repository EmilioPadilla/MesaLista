-- AlterTable
ALTER TABLE "rsvp_messages" ALTER COLUMN "confirmation_message" SET DEFAULT '¡Gracias por confirmar tu asistencia! Nos encantará verte en nuestro evento.';

-- Make invitee secret codes unique per gift list (instead of globally), and re-link
-- carts to invitations by invitee id rather than by the shared secret code.

-- 1. Add the new invitee_id column to carts.
ALTER TABLE "carts" ADD COLUMN "invitee_id" TEXT;

-- 2. Backfill invitee_id from the existing rsvp_code links while secret codes are
--    still globally unique (so the match is unambiguous).
UPDATE "carts" c
SET "invitee_id" = i."id"
FROM "invitees" i
WHERE UPPER(BTRIM(c."rsvp_code")) = UPPER(BTRIM(i."secret_code"));

-- 3. Drop the old rsvp_code -> secret_code foreign key and its index.
ALTER TABLE "carts" DROP CONSTRAINT "carts_rsvp_code_fkey";
DROP INDEX "carts_rsvp_code_idx";

-- 4. Replace the global unique on secret_code with a per-gift-list unique.
DROP INDEX "invitees_secret_code_key";
DROP INDEX "invitees_secret_code_idx";
CREATE UNIQUE INDEX "invitees_gift_list_id_secret_code_key" ON "invitees"("gift_list_id", "secret_code");

-- 5. Wire up the new invitee_id foreign key and index.
CREATE INDEX "carts_invitee_id_idx" ON "carts"("invitee_id");
ALTER TABLE "carts" ADD CONSTRAINT "carts_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "invitees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
