/*
  Warnings:

  - You are about to drop the column `companyId` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_companyId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- DropIndex
DROP INDEX "Brand_name_companyId_key";

-- DropIndex
DROP INDEX "Category_name_companyId_key";

-- DropIndex
DROP INDEX "Customer_email_companyId_key";

-- DropIndex
DROP INDEX "Customer_name_companyId_key";

-- DropIndex
DROP INDEX "Product_name_companyId_key";

-- DropIndex
DROP INDEX "Supplier_name_companyId_key";

-- AlterTable
ALTER TABLE "Brand" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "companyId";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
