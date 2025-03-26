import "server-only";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";

export async function getProductsData({
  companyId,
  pageParam,
  searchParam
}: {
  companyId: string;
  pageParam?: string | string[] | null;
  searchParam?: string | string[] | null;
}) {
  const page = typeof pageParam === "string" ? Math.max(1, Number(pageParam) || 1) : 1;
  const searchTerm = typeof searchParam === "string" ? searchParam : "";
  
  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (page - 1);

  let where: Prisma.ProductWhereInput = { companyId };

  if (searchTerm) {
    where = {
      AND: [
        { companyId },
        {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      ],
    };
  }

  const [products, totalCount, categories, brands, suppliers] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
  ]);

  return {
    products,
    totalCount,
    categories,
    brands,
    suppliers,
    currentPage: page,
    searchTerm
  };
}