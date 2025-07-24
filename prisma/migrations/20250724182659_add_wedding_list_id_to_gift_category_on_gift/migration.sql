/*
  Warnings:

  - Added the required column `wedding_list_id` to the `gift_categories_on_gifts` table without a default value. This is not possible if the table is not empty.
  - Made the column `firstName` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gift_categories_on_gifts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gift_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "wedding_list_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gift_categories_on_gifts_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_categories_on_gifts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gift_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_categories_on_gifts_wedding_list_id_fkey" FOREIGN KEY ("wedding_list_id") REFERENCES "wedding_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_gift_categories_on_gifts" ("category_id", "created_at", "gift_id", "id") SELECT "category_id", "created_at", "gift_id", "id" FROM "gift_categories_on_gifts";
DROP TABLE "gift_categories_on_gifts";
ALTER TABLE "new_gift_categories_on_gifts" RENAME TO "gift_categories_on_gifts";
CREATE UNIQUE INDEX "gift_categories_on_gifts_gift_id_category_id_key" ON "gift_categories_on_gifts"("gift_id", "category_id");
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "spouseFirstName" TEXT,
    "spouseLastName" TEXT,
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GUEST',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "firstName", "id", "imageUrl", "lastName", "password", "phoneNumber", "role", "spouseFirstName", "spouseLastName", "updated_at") SELECT "created_at", "email", "firstName", "id", "imageUrl", "lastName", "password", "phoneNumber", "role", "spouseFirstName", "spouseLastName", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
