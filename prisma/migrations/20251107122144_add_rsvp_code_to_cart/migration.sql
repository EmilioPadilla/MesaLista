-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "rsvp_code" TEXT;

-- CreateIndex
CREATE INDEX "carts_rsvp_code_idx" ON "carts"("rsvp_code");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_rsvp_code_fkey" FOREIGN KEY ("rsvp_code") REFERENCES "invitees"("secret_code") ON DELETE SET NULL ON UPDATE CASCADE;
