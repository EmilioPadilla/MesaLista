/*
  Warnings:

  - Added the required column `price` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "money_bags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cart_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_type" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "transaction_fee" REAL,
    "payment_status" TEXT NOT NULL,
    "payer_email" TEXT,
    "payer_name" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "money_bags_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cart_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cart_id" INTEGER NOT NULL,
    "gift_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Join with gifts table to get the price for existing cart items
INSERT INTO "new_cart_items" ("cart_id", "created_at", "gift_id", "id", "quantity", "updated_at", "price") 
SELECT ci."cart_id", ci."created_at", ci."gift_id", ci."id", ci."quantity", ci."updated_at", g."price" 
FROM "cart_items" ci
JOIN "gifts" g ON ci."gift_id" = g."id";
DROP TABLE "cart_items";
ALTER TABLE "new_cart_items" RENAME TO "cart_items";
CREATE UNIQUE INDEX "cart_items_cart_id_gift_id_key" ON "cart_items"("cart_id", "gift_id");
CREATE TABLE "new_carts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "invitee_name" TEXT,
    "invitee_email" TEXT,
    "country" TEXT,
    "phone_number" TEXT,
    "message" TEXT,
    "payment_type" TEXT,
    "payment_id" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" DATETIME,
    "total_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_carts" ("country", "created_at", "id", "invitee_email", "invitee_name", "message", "phone_number", "session_id", "updated_at") SELECT "country", "created_at", "id", "invitee_email", "invitee_name", "message", "phone_number", "session_id", "updated_at" FROM "carts";
DROP TABLE "carts";
ALTER TABLE "new_carts" RENAME TO "carts";
CREATE UNIQUE INDEX "carts_session_id_key" ON "carts"("session_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "money_bags_cart_id_key" ON "money_bags"("cart_id");
