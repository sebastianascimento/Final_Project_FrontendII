/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Brand_name_key";

-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Customer_name_key";

-- DropIndex
DROP INDEX "Product_name_key";

-- DropIndex
DROP INDEX "Supplier_name_key";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "companyId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_companyId_key" ON "Brand"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_companyId_key" ON "Category"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_companyId_key" ON "Customer"("email", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_companyId_key" ON "Customer"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_companyId_key" ON "Product"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_companyId_key" ON "Supplier"("name", "companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
