-- CreateTable
CREATE TABLE "predesigned_lists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predesigned_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predesigned_gifts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "categories" TEXT[] NOT NULL,
    "image_url" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'media',
    "predesigned_list_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predesigned_gifts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "predesigned_gifts" ADD CONSTRAINT "predesigned_gifts_predesigned_list_id_fkey" FOREIGN KEY ("predesigned_list_id") REFERENCES "predesigned_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
