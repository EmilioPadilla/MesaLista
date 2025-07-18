/*
  Warnings:

  - You are about to drop the column `weddingLocation` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wedding_lists" ADD COLUMN "weddingLocation" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "spouseFirstName" TEXT,
    "spouseLastName" TEXT,
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GUEST',
    "weddingDate" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "firstName", "id", "imageUrl", "lastName", "password", "phoneNumber", "role", "spouseFirstName", "spouseLastName", "updated_at", "weddingDate") SELECT "created_at", "email", "firstName", "id", "imageUrl", "lastName", "password", "phoneNumber", "role", "spouseFirstName", "spouseLastName", "updated_at", "weddingDate" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
