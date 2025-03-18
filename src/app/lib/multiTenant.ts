// [2025-03-14 14:22:06] @sebastianascimento - Correção para suportar plural e singular
import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cache } from "react";

// Definir os modelos válidos, agora suportando singular e plural
type ValidModelsSingular = "product" | "customer" | "order" | "category" | "brand" | "supplier";
type ValidModelsPlural = "products" | "customers" | "orders" | "categories" | "brands" | "suppliers";
type ValidModels = ValidModelsSingular | ValidModelsPlural;

// Mapeamento de plural para singular
const pluralToSingular: Record<string, string> = {
  "products": "product",
  "customers": "customer",
  "orders": "order",
  "categories": "category",
  "brands": "brand",
  "suppliers": "supplier"
};

// Normalizar nome do modelo (converter plural para singular)
function normalizeModelName(model: ValidModels): ValidModelsSingular {
  return (pluralToSingular[model] || model) as ValidModelsSingular;
}

// Função otimizada para obter companyId com cache
export const getCurrentCompanyId = cache(async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Usuário não autenticado");
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { companyId: true }
  });
  
  const companyId = user?.companyId;
  
  if (!companyId) {
    throw new Error("Usuário sem empresa associada");
  }
  
  console.log(`[2025-03-14 14:22:06] @sebastianascimento - Obtendo companyId: ${companyId}`);
  return companyId;
});

// Cliente Prisma isolado por tenant
export async function getTenantPrisma() {
  try {
    const companyId = await getCurrentCompanyId();
    
    return {
      product: {
        findMany: (args: any = {}) => prisma.product.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        findFirst: (args: any = {}) => prisma.product.findFirst({
          ...args,
          where: { ...args.where, companyId }
        }),
        findUnique: (args: any = {}) => {
          if (args.where?.id) {
            return prisma.product.findFirst({
              ...args,
              where: { id: args.where.id, companyId }
            });
          }
          return prisma.product.findUnique(args);
        },
        count: (args: any = {}) => prisma.product.count({
          ...args,
          where: { ...args.where, companyId }
        }),
      },
      
      customer: {
        findMany: (args: any = {}) => prisma.customer.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        findFirst: (args: any = {}) => prisma.customer.findFirst({
          ...args,
          where: { ...args.where, companyId }
        }),
        findUnique: (args: any = {}) => {
          if (args.where?.id) {
            return prisma.customer.findFirst({
              ...args,
              where: { id: args.where.id, companyId }
            });
          }
          return prisma.customer.findUnique(args);
        },
        count: (args: any = {}) => prisma.customer.count({
          ...args,
          where: { ...args.where, companyId }
        })
      },
      
      order: {
        findMany: (args: any = {}) => prisma.order.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        findFirst: (args: any = {}) => prisma.order.findFirst({
          ...args,
          where: { ...args.where, companyId }
        }),
        count: (args: any = {}) => prisma.order.count({
          ...args,
          where: { ...args.where, companyId }
        })
      },
      
      category: {
        findMany: (args: any = {}) => prisma.category.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        count: (args: any = {}) => prisma.category.count({
          ...args,
          where: { ...args.where, companyId }
        })
      },
      
      brand: {
        findMany: (args: any = {}) => prisma.brand.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        count: (args: any = {}) => prisma.brand.count({
          ...args,
          where: { ...args.where, companyId }
        })
      },
      
      supplier: {
        findMany: (args: any = {}) => prisma.supplier.findMany({
          ...args,
          where: { ...args.where, companyId }
        }),
        count: (args: any = {}) => prisma.supplier.count({
          ...args, 
          where: { ...args.where, companyId }
        })
      }
    };
  } catch (error) {
    console.error(`[2025-03-14 14:22:06] @sebastianascimento - Erro ao obter tenant prisma:`, error);
    throw new Error("Falha no acesso seguro aos dados");
  }
}

// Função segura para listar por modelo (agora com suporte a plural)
export async function listAllByCompany(model: ValidModels, options: any = {}) {
  const tenantPrisma = await getTenantPrisma();
  // IMPORTANTE: Normalizar nome do modelo para singular 
  const normalizedModel = normalizeModelName(model);
  
  switch (normalizedModel) {
    case 'product':
      return tenantPrisma.product.findMany(options);
    case 'customer':
      return tenantPrisma.customer.findMany(options);
    case 'order':
      return tenantPrisma.order.findMany(options);
    case 'category':
      return tenantPrisma.category.findMany(options);
    case 'brand':
      return tenantPrisma.brand.findMany(options);
    case 'supplier':
      return tenantPrisma.supplier.findMany(options);
    default:
      throw new Error(`Modelo não suportado: ${model}`);
  }
}

// Função para contar registros por modelo (agora com suporte a plural)
export async function countByCompany(model: ValidModels): Promise<number> {
  const tenantPrisma = await getTenantPrisma();
  // IMPORTANTE: Normalizar nome do modelo para singular
  const normalizedModel = normalizeModelName(model);
  
  switch (normalizedModel) {
    case 'product':
      return tenantPrisma.product.count();
    case 'customer':
      return tenantPrisma.customer.count();
    case 'order':
      return tenantPrisma.order.count();
    case 'category':
      return tenantPrisma.category.count();
    case 'brand':
      return tenantPrisma.brand.count();
    case 'supplier':
      return tenantPrisma.supplier.count();
    default:
      throw new Error(`Modelo não suportado: ${model}`);
  }
}

// Função helper para adicionar filtro de companyId a qualquer consulta
export async function withCompanyFilter(filter: any = {}) {
  const companyId = await getCurrentCompanyId();
  return { ...filter, companyId };
}