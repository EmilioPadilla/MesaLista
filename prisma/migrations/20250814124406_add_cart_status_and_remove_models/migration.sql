/*
  Warnings:

  - You are about to drop the `gift_purchases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `money_bags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `is_paid` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `payment_type` on the `carts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "money_bags_cart_id_key";

-- DropIndex
DROP INDEX "orders_cart_id_key";

-- DropIndex
DROP INDEX "orders_order_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "gift_purchases";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "money_bags";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "orders";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cart_id" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_type" TEXT NOT NULL,
    "transaction_fee" REAL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_carts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "invitee_name" TEXT,
    "invitee_email" TEXT,
    "country" TEXT,
    "phone_number" TEXT,
    "message" TEXT,
    "payment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_carts" ("country", "created_at", "id", "invitee_email", "invitee_name", "message", "payment_id", "phone_number", "session_id", "total_amount", "updated_at") SELECT "country", "created_at", "id", "invitee_email", "invitee_name", "message", "payment_id", "phone_number", "session_id", "total_amount", "updated_at" FROM "carts";
DROP TABLE "carts";
ALTER TABLE "new_carts" RENAME TO "carts";
CREATE UNIQUE INDEX "carts_session_id_key" ON "carts"("session_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "payments_cart_id_key" ON "payments"("cart_id");
