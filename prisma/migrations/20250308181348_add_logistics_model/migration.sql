/*
  Warnings:

  - You are about to drop the column `shippingId` on the `Employee` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_shippingId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "shippingId";

-- CreateTable
CREATE TABLE "_ShippingEmployees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ShippingEmployees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ShippingEmployees_B_index" ON "_ShippingEmployees"("B");

-- AddForeignKey
ALTER TABLE "_ShippingEmployees" ADD CONSTRAINT "_ShippingEmployees_A_fkey" FOREIGN KEY ("A") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ShippingEmployees" ADD CONSTRAINT "_ShippingEmployees_B_fkey" FOREIGN KEY ("B") REFERENCES "Shipping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
