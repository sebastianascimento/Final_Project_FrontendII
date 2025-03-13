-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shippingId" INTEGER NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_shippingId_fkey" FOREIGN KEY ("shippingId") REFERENCES "Shipping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
