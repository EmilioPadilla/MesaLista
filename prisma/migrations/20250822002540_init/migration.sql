-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('COUPLE', 'GUEST', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('PAYPAL', 'STRIPE', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'REIMBURSED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CartStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "spouseFirstName" TEXT,
    "spouseLastName" TEXT,
    "coupleSlug" TEXT,
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'GUEST',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wedding_lists" (
    "id" SERIAL NOT NULL,
    "couple_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coupleName" TEXT NOT NULL,
    "invitationCount" INTEGER NOT NULL DEFAULT 0,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "weddingLocation" TEXT,
    "imageUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gifts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "isMostWanted" BOOLEAN NOT NULL DEFAULT false,
    "wedding_list_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gift_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gift_categories_on_gifts" (
    "id" SERIAL NOT NULL,
    "gift_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "wedding_list_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_categories_on_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "invitee_name" TEXT,
    "invitee_email" TEXT,
    "country" TEXT,
    "phone_number" TEXT,
    "message" TEXT,
    "payment_id" TEXT,
    "status" "public"."CartStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_items" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "gift_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_type" "public"."PaymentType" NOT NULL,
    "transaction_fee" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_coupleSlug_key" ON "public"."users"("coupleSlug");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_lists_couple_id_key" ON "public"."wedding_lists"("couple_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_name_key" ON "public"."gift_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_on_gifts_gift_id_category_id_key" ON "public"."gift_categories_on_gifts"("gift_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_session_id_key" ON "public"."carts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_gift_id_key" ON "public"."cart_items"("cart_id", "gift_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_cart_id_key" ON "public"."payments"("cart_id");

-- AddForeignKey
ALTER TABLE "public"."wedding_lists" ADD CONSTRAINT "wedding_lists_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gifts" ADD CONSTRAINT "gifts_wedding_list_id_fkey" FOREIGN KEY ("wedding_list_id") REFERENCES "public"."wedding_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_categories_on_gifts" ADD CONSTRAINT "gift_categories_on_gifts_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_categories_on_gifts" ADD CONSTRAINT "gift_categories_on_gifts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."gift_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_categories_on_gifts" ADD CONSTRAINT "gift_categories_on_gifts_wedding_list_id_fkey" FOREIGN KEY ("wedding_list_id") REFERENCES "public"."wedding_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
