/*
  Warnings:

  - You are about to drop the `_BrandToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CategoryToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductToSupplier` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `brandId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_BrandToProduct" DROP CONSTRAINT "_BrandToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_BrandToProduct" DROP CONSTRAINT "_BrandToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToProduct" DROP CONSTRAINT "_CategoryToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToProduct" DROP CONSTRAINT "_CategoryToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToSupplier" DROP CONSTRAINT "_ProductToSupplier_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToSupplier" DROP CONSTRAINT "_ProductToSupplier_B_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandId" INTEGER NOT NULL,
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "supplierId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_BrandToProduct";

-- DropTable
DROP TABLE "_CategoryToProduct";

-- DropTable
DROP TABLE "_ProductToSupplier";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
