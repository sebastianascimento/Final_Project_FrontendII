import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // CATEGORIES
  const categoryNames = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Description for ${name}`,
      },
    });
    categories.push(category);
  }

  // BRANDS
  const brandNames = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E'];
  const brands = [];
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Description for ${name}`,
      },
    });
    brands.push(brand);
  }

  // SUPPLIERS
  const supplierNames = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];
  const suppliers = [];
  for (const name of supplierNames) {
    const supplier = await prisma.supplier.upsert({
      where: { name } as any,
      update: {},
      create: {
        name,
        contactInfo: `Contact info for ${name}`,
      },
    });
    suppliers.push(supplier);
  }

  // PRODUCTS
  const products = [];
  for (let i = 1; i <= 50; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `Description for Product ${i}`,
        price: Math.random() * 100 + 50,
        category: { connect: { id: categories[i % categories.length].id } },
        brand: { connect: { id: brands[i % brands.length].id } },
        supplier: { connect: { id: suppliers[i % suppliers.length].id } },
      },
    });
    products.push(product);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });