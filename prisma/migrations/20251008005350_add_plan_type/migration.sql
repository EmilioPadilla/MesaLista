-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('FIXED', 'COMMISSION');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "plan_type" "public"."PlanType";
