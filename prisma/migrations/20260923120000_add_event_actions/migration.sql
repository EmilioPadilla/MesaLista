-- Admin event calendar: a log of the follow-ups each event needs around its date
-- (bank info email a week before, receiving the couple's CLABE, paying them out).
--
-- Only completed or skipped actions are stored. What is due, and when, is derived
-- from gift_lists.event_date plus the schedule in the shared EVENT_ACTIONS config,
-- so changing a deadline never needs a data migration.
CREATE TYPE "EventActionStatus" AS ENUM ('DONE', 'SKIPPED');

CREATE TABLE "event_actions" (
    "id" SERIAL NOT NULL,
    "gift_list_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "status" "EventActionStatus" NOT NULL DEFAULT 'DONE',
    "note" TEXT,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_actions_pkey" PRIMARY KEY ("id")
);

-- One row per action per list: re-logging an action updates it in place.
CREATE UNIQUE INDEX "event_actions_gift_list_id_action_key" ON "event_actions"("gift_list_id", "action");

ALTER TABLE "event_actions" ADD CONSTRAINT "event_actions_gift_list_id_fkey" FOREIGN KEY ("gift_list_id") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_actions" ADD CONSTRAINT "event_actions_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
