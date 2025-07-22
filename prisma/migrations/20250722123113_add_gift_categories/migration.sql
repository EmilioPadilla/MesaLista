/*
  Warnings:

  - You are about to drop the column `category` on the `gifts` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "gift_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "gift_categories_on_gifts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gift_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gift_categories_on_gifts_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_categories_on_gifts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gift_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gifts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "imageUrl" TEXT,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "isMostWanted" BOOLEAN NOT NULL DEFAULT false,
    "wedding_list_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "gifts_wedding_list_id_fkey" FOREIGN KEY ("wedding_list_id") REFERENCES "wedding_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_gifts" ("created_at", "description", "id", "imageUrl", "isMostWanted", "isPurchased", "price", "quantity", "title", "updated_at", "wedding_list_id") SELECT "created_at", "description", "id", "imageUrl", "isMostWanted", "isPurchased", "price", "quantity", "title", "updated_at", "wedding_list_id" FROM "gifts";
DROP TABLE "gifts";
ALTER TABLE "new_gifts" RENAME TO "gifts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_name_key" ON "gift_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_on_gifts_gift_id_category_id_key" ON "gift_categories_on_gifts"("gift_id", "category_id");
