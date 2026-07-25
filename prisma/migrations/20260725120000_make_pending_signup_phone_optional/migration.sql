-- The phone number is optional at signup (App Store guideline 5.1.1(v)), so a
-- pending IAP signup can be stored without one.
ALTER TABLE "pending_plan_signups" ALTER COLUMN "phone_number" DROP NOT NULL;
