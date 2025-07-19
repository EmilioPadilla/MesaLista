-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gifts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "isMostWanted" BOOLEAN NOT NULL DEFAULT false,
    "wedding_list_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "gifts_wedding_list_id_fkey" FOREIGN KEY ("wedding_list_id") REFERENCES "wedding_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_gifts" ("category", "created_at", "description", "id", "imageUrl", "isPurchased", "price", "title", "updated_at", "wedding_list_id") SELECT "category", "created_at", "description", "id", "imageUrl", "isPurchased", "price", "title", "updated_at", "wedding_list_id" FROM "gifts";
DROP TABLE "gifts";
ALTER TABLE "new_gifts" RENAME TO "gifts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
