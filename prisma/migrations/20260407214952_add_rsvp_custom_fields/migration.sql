-- CreateEnum
CREATE TYPE "RsvpCustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN');

-- CreateTable
CREATE TABLE "rsvp_custom_fields" (
    "id" SERIAL NOT NULL,
    "gift_list_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RsvpCustomFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_custom_field_responses" (
    "id" SERIAL NOT NULL,
    "invitee_id" TEXT NOT NULL,
    "field_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_custom_field_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rsvp_custom_fields_gift_list_id_idx" ON "rsvp_custom_fields"("gift_list_id");

-- CreateIndex
CREATE INDEX "rsvp_custom_field_responses_invitee_id_idx" ON "rsvp_custom_field_responses"("invitee_id");

-- CreateIndex
CREATE INDEX "rsvp_custom_field_responses_field_id_idx" ON "rsvp_custom_field_responses"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_custom_field_responses_invitee_id_field_id_key" ON "rsvp_custom_field_responses"("invitee_id", "field_id");

-- AddForeignKey
ALTER TABLE "rsvp_custom_fields" ADD CONSTRAINT "rsvp_custom_fields_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_custom_field_responses" ADD CONSTRAINT "rsvp_custom_field_responses_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "invitees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_custom_field_responses" ADD CONSTRAINT "rsvp_custom_field_responses_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "rsvp_custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
