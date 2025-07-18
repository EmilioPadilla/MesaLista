-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_wedding_lists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couple_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coupleName" TEXT NOT NULL,
    "invitationCount" INTEGER NOT NULL DEFAULT 0,
    "weddingDate" DATETIME NOT NULL,
    "weddingLocation" TEXT,
    "imageUrl" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wedding_lists_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wedding_lists" ("coupleName", "couple_id", "created_at", "description", "id", "imageUrl", "title", "updated_at", "weddingDate", "weddingLocation") SELECT "coupleName", "couple_id", "created_at", "description", "id", "imageUrl", "title", "updated_at", "weddingDate", "weddingLocation" FROM "wedding_lists";
DROP TABLE "wedding_lists";
ALTER TABLE "new_wedding_lists" RENAME TO "wedding_lists";
CREATE UNIQUE INDEX "wedding_lists_couple_id_key" ON "wedding_lists"("couple_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
