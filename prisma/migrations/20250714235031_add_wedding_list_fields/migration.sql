/*
  Warnings:

  - Added the required column `coupleName` to the `wedding_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weddingDate` to the `wedding_lists` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_wedding_lists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couple_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coupleName" TEXT NOT NULL,
    "weddingDate" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wedding_lists_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wedding_lists" ("couple_id", "created_at", "description", "id", "title", "updated_at", "coupleName", "weddingDate", "imageUrl") 
SELECT 
  "couple_id", 
  "created_at", 
  "description", 
  "id", 
  "title", 
  "updated_at", 
  (SELECT name FROM "users" WHERE "id" = "couple_id") || ' Wedding', 
  DATETIME('now', '+6 months'), 
  'https://via.placeholder.com/150' 
FROM "wedding_lists";
DROP TABLE "wedding_lists";
ALTER TABLE "new_wedding_lists" RENAME TO "wedding_lists";
CREATE UNIQUE INDEX "wedding_lists_couple_id_key" ON "wedding_lists"("couple_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
