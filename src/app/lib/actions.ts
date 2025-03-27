"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { CustomerSchema, OrderSchema, ProductSchema, ShippingSchema, StockSchema } from "./formValidationSchemas";
import { getServerSession } from "next-auth"; 
import { authOptions } from "../api/auth/[...nextauth]/auth";

type CurrentState = { success: boolean; error: boolean; message?: string; };
type ActionResult = { success: boolean; error: boolean; message?: string; };


async function getCompanyId(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Usuário não autenticado");
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: true }
  });
  
  const companyId = session?.user?.companyId || user?.companyId;
  
  if (companyId) {
    return companyId;
  }
  
  if (user) {
    const company = await prisma.company.create({
      data: { name: `Empresa de ${user.name || user.email.split('@')[0]}` }
    });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    });
    
    return company.id;
  }
  
  throw new Error("Não foi possível obter ou criar empresa para o usuário");
}

// Função reutilizável para garantir que um registro pertence à empresa do usuário
async function validateOwnership<T extends { id: number; companyId?: string }>(
  model: any,
  id: number,
  errorMessage: string = "Registro não encontrado ou não pertence à sua empresa"
): Promise<T> {
  const companyId = await getCompanyId();
  
  const record = await model.findFirst({
    where: { id, companyId }
  });
  
  if (!record) {
    throw new Error(errorMessage);
  }
  
  return record;
}


async function findOrCreateRelated(
  model: any, 
  name: string, 
  additionalData: Record<string, any> = {}
) {
  const companyId = await getCompanyId();
  
  // Tentar encontrar a entidade existente
  const existing = await model.findFirst({
    where: { name, companyId }
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Criar nova entidade
  const created = await model.create({
    data: {
      name,
      ...additionalData,
      companyId
    }
  });
  
  return created.id;
}


export async function createCompany(companyName: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return { error: true, message: "Usuário não autenticado" };
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });
    
    if (existingUser?.companyId) {
      return {
        error: false,
        companyId: existingUser.companyId,
        companyName: existingUser.company?.name || companyName,
      };
    }
    
    const company = await prisma.company.create({
      data: { name: companyName }
    });
    
    await prisma.user.update({
      where: { email: session.user.email },
      data: { companyId: company.id },
    });
    
    return {
      error: false,
      companyId: company.id,
      companyName: company.name,
    };
  } catch (error) {
    return { error: true, message: "Erro ao criar empresa" };
  }
}



export const createProduct = async (
  currentState: CurrentState,
  data: ProductSchema
) => {
  try {
    const companyId = await getCompanyId();
    
    // Lidar com relações usando a função helper
    const categoryId = data.categoryName 
      ? await findOrCreateRelated(prisma.category, data.categoryName)
      : undefined;
      
    const brandId = data.brandName 
      ? await findOrCreateRelated(prisma.brand, data.brandName)
      : undefined;
      
    const supplierId = data.supplierName 
      ? await findOrCreateRelated(prisma.supplier, data.supplierName, {
          contactInfo: data.supplierContactInfo || `Contact info for ${data.supplierName}`
        })
      : undefined;
    
    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        companyId,
        categoryId,
        brandId,
        supplierId
      },
    });
    
    revalidatePath("/list/products");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro desconhecido" 
    };
  }
};

export async function listProducts(
  filter = {}, 
  page = 1, 
  limit = 10, 
  sort = { field: 'updatedAt', direction: 'desc' }
) {
  try {
    const companyId = await getCompanyId();
    const secureFilter = { ...filter, companyId };
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: secureFilter,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.direction } : { updatedAt: 'desc' },
        include: { category: true, brand: true, supplier: true }
      }),
      prisma.product.count({ where: secureFilter })
    ]);
    
    return {
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Erro ao listar produtos",
      data: [],
      pagination: { total: 0, page, limit, totalPages: 0 }
    };
  }
}

export const updateProduct = async (
  currentState: CurrentState,
  data: ProductSchema
) => {
  try {
    if (!data.id) {
      throw new Error("Product ID is required for update");
    }
    
    // Validar propriedade do produto
    await validateOwnership(prisma.product, data.id);
    const companyId = await getCompanyId();
    
    // Verificar se já existe um produto com o mesmo nome nesta empresa
    // (excluindo o produto atual que está sendo atualizado)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: data.name,
        companyId,
        id: { not: data.id } // Exclui o próprio produto da verificação
      }
    });
    
    if (existingProduct) {
      throw new Error("Já existe um produto com este nome em sua empresa");
    }
    
    // Lidar com relações usando a função helper
    const categoryId = data.categoryName 
      ? await findOrCreateRelated(prisma.category, data.categoryName)
      : undefined;
      
    const brandId = data.brandName 
      ? await findOrCreateRelated(prisma.brand, data.brandName)
      : undefined;
      
    const supplierId = data.supplierName 
      ? await findOrCreateRelated(prisma.supplier, data.supplierName, {
          contactInfo: data.supplierContactInfo || `Contact info for ${data.supplierName}`
        })
      : undefined;

    await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId,
        brandId,
        supplierId,
      },
    });

    revalidatePath("/list/products");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro desconhecido" 
    };
  }
};

export const deleteProduct = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  if (!id) {
    return { success: false, error: true, message: "ID não fornecido" };
  }
  
  try {
    const productId = parseInt(id);
    
    await validateOwnership(prisma.product, productId);
    
    const ordersCount = await prisma.order.count({
      where: { productId }
    });
    
    if (ordersCount > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Não é possível excluir este produto pois está sendo usado em ${ordersCount} pedido(s). Remova os pedidos primeiro.` 
      };
    }
    
    const shippingsCount = await prisma.shipping.count({
      where: { productId }
    });
    
    if (shippingsCount > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Não é possível excluir este produto pois está sendo usado em ${shippingsCount} envio(s). Remova os envios primeiro.` 
      };
    }
    
    const stocksCount = await prisma.stock.count({
      where: { productId }
    });
    
    if (stocksCount > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Não é possível excluir este produto pois está associado a ${stocksCount} registro(s) de estoque. Remova os estoques primeiro.` 
      };
    }
    
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/list/products");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
};


export const createOrder = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: OrderSchema
): Promise<{ success: boolean; error: boolean; message?: string }> => {
  try {
    // Obter ID da empresa para isolamento multi-tenant
    const companyId = await getCompanyId();
    
    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criando pedido para empresa ${companyId}`);
    
    // --- Primeiro, encontre ou crie o produto ---
    let productId: number;
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: data.product,
        companyId // MULTI-TENANT: Garantir que é da mesma empresa
      }
    });

    if (existingProduct) {
      productId = existingProduct.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Usando produto existente: ${existingProduct.name} (ID: ${existingProduct.id})`);
    } else {
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criando novo produto: ${data.product}`);
      
      // --- Se precisamos criar um produto, precisamos primeiro tratar das relações ---
      // 1. Encontrar ou criar categoria padrão
      let categoryId: number | undefined;
      const categoryName = "Default Category";
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name: categoryName,
          companyId // MULTI-TENANT
        }
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.category.create({
          data: { 
            name: categoryName,
            companyId // MULTI-TENANT: Associar categoria à empresa
          }
        });
        categoryId = newCategory.id;
        console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criada categoria padrão: ${newCategory.id}`);
      }
      
      // 2. Encontrar ou criar marca padrão
      let brandId: number | undefined;
      const brandName = "Default Brand";
      const existingBrand = await prisma.brand.findFirst({
        where: { 
          name: brandName,
          companyId // MULTI-TENANT
        }
      });
      
      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const newBrand = await prisma.brand.create({
          data: { 
            name: brandName,
            companyId // MULTI-TENANT: Associar marca à empresa
          }
        });
        brandId = newBrand.id;
        console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criada marca padrão: ${newBrand.id}`);
      }
      
      // 3. Encontrar ou criar fornecedor padrão
      let supplierId: number | undefined;
      const supplierName = "Default Supplier";
      const existingSupplier = await prisma.supplier.findFirst({
        where: { 
          name: supplierName,
          companyId // MULTI-TENANT
        }
      });
      
      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else {
        const newSupplier = await prisma.supplier.create({
          data: { 
            name: supplierName,
            contactInfo: "Default Contact Info",
            companyId // MULTI-TENANT: Associar fornecedor à empresa
          }
        });
        supplierId = newSupplier.id;
        console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criado fornecedor padrão: ${newSupplier.id}`);
      }
      
      // Agora crie o produto com todas as relações por ID e companyId
      const newProduct = await prisma.product.create({
        data: {
          name: data.product,
          description: "Produto criado automaticamente pelo sistema de pedidos",
          price: 0,
          categoryId,
          brandId,
          supplierId,
          companyId // MULTI-TENANT: Associar produto à empresa
        }
      });
      
      productId = newProduct.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Produto criado: ${newProduct.id}`);
    }

    // --- Encontre ou crie o cliente ---
    let customerId: number;
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        name: data.customer,
        companyId // MULTI-TENANT: Garantir que é da mesma empresa
      }
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Usando cliente existente: ${existingCustomer.name} (ID: ${existingCustomer.id})`);
    } else {
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Criando novo cliente: ${data.customer}`);
      const newCustomer = await prisma.customer.create({
        data: {
          name: data.customer,
          email: `${data.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          address: data.address || "Endereço não especificado",
          companyId // MULTI-TENANT: Associar cliente à empresa
        }
      });
      customerId = newCustomer.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Cliente criado: ${newCustomer.id}`);
    }

    // Criar o pedido com companyId
    const order = await prisma.order.create({
      data: {
        quantity: data.quantity,
        address: data.address || "Endereço não especificado",
        status: data.status,
        productId,
        customerId,
        companyId // MULTI-TENANT: Associar pedido à empresa
      },
    });

    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Pedido criado com sucesso: ${order.id}`);

    revalidatePath("/list/orders");
    return { 
      success: true, 
      error: false, 
      message: `Pedido #${order.id} criado com sucesso` 
    };
  } catch (err) {
    console.error("[2025-03-14 15:47:57] @sebastianascimento - Erro ao criar pedido:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro ao processar pedido" 
    };
  }
};

/**
 * Função para atualizar um pedido existente com verificação de propriedade multi-tenant
 */
export const updateOrder = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: OrderSchema
): Promise<{ success: boolean; error: boolean; message?: string }> => {
  try {
    if (!data.id) {
      throw new Error("ID do pedido é necessário para atualização");
    }
    
    // Obter ID da empresa para isolamento multi-tenant
    const companyId = await getCompanyId();
    
    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Atualizando pedido ${data.id} para empresa ${companyId}`);
    
    // MULTI-TENANT: Verificar se o pedido pertence à empresa do usuário
    const orderExists = await prisma.order.findFirst({
      where: {
        id: data.id,
        companyId
      }
    });
    
    if (!orderExists) {
      throw new Error("Pedido não encontrado ou não pertence à sua empresa");
    }

    // --- Verificar e obter produto ---
    let productId: number;
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: data.product,
        companyId // MULTI-TENANT: Garantir que é da mesma empresa
      }
    });

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      // Se o produto não existe, criar um novo com relacionamentos padrão
      // (código similar ao da função createOrder para criar um produto)
      // 1. Encontrar ou criar categoria padrão
      let categoryId: number | undefined;
      const categoryName = "Default Category";
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryName, companyId }
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.category.create({
          data: { name: categoryName, companyId }
        });
        categoryId = newCategory.id;
      }
      
      // 2 & 3. Obter ou criar brand e supplier (código similar ao anterior)
      let brandId = (await prisma.brand.findFirst({ 
        where: { name: "Default Brand", companyId }
      }))?.id;
      
      if (!brandId) {
        brandId = (await prisma.brand.create({
          data: { name: "Default Brand", companyId }
        })).id;
      }
      
      let supplierId = (await prisma.supplier.findFirst({ 
        where: { name: "Default Supplier", companyId }
      }))?.id;
      
      if (!supplierId) {
        supplierId = (await prisma.supplier.create({
          data: { 
            name: "Default Supplier", 
            contactInfo: "Default Contact Info",
            companyId
          }
        })).id;
      }
      
      // Criar produto
      const newProduct = await prisma.product.create({
        data: {
          name: data.product,
          description: "Produto criado durante atualização de pedido",
          price: 0,
          categoryId,
          brandId,
          supplierId,
          companyId
        }
      });
      
      productId = newProduct.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Novo produto criado durante atualização: ${newProduct.id}`);
    }

    // --- Verificar e obter cliente ---
    let customerId: number;
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        name: data.customer,
        companyId // MULTI-TENANT
      }
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          name: data.customer,
          email: `${data.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          address: data.address || "Endereço não especificado",
          companyId // MULTI-TENANT
        }
      });
      customerId = newCustomer.id;
      console.log(`[2025-03-14 15:47:57] @sebastianascimento - Novo cliente criado durante atualização: ${newCustomer.id}`);
    }

    // --- Agora atualize o pedido existente ---
    const updatedOrder = await prisma.order.update({
      where: {
        id: data.id
      },
      data: {
        quantity: data.quantity,
        address: data.address || orderExists.address,
        status: data.status,
        productId,
        customerId
        // Não atualizamos companyId para evitar alteração de propriedade entre empresas
      },
    });

    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Pedido atualizado com sucesso: ${updatedOrder.id}`);

    revalidatePath("/list/orders");
    return { 
      success: true, 
      error: false, 
      message: `Pedido #${updatedOrder.id} atualizado com sucesso`
    };
  } catch (err) {
    console.error("[2025-03-14 15:47:57] @sebastianascimento - Erro ao atualizar pedido:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro ao atualizar pedido"
    };
  }
};

/**
 * Função para excluir um pedido com verificação de propriedade multi-tenant
 */
export const deleteOrder = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: FormData
): Promise<{ success: boolean; error: boolean; message?: string }> => {
  const id = data.get("id") as string;
  
  console.log("[2025-03-14 15:47:57] @sebastianascimento - Tentando excluir pedido - ID recebido:", id);
  
  if (!id) {
    return { 
      success: false, 
      error: true, 
      message: "ID do pedido não fornecido" 
    };
  }
  
  try {
    const orderId = Number(id);
    
    if (isNaN(orderId)) {
      return { 
        success: false, 
        error: true, 
        message: "ID do pedido inválido" 
      };
    }
    
    const companyId = await getCompanyId();
    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Verificando propriedade do pedido ${orderId} para empresa ${companyId}`);
    
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId 
      }
    });
    
    if (!order) {
      return { 
        success: false, 
        error: true, 
        message: "Pedido não encontrado ou não pertence à sua empresa" 
      };
    }
    
    // Excluir o pedido
    await prisma.order.delete({
      where: {
        id: orderId
      }
    });
    
    console.log(`[2025-03-14 15:47:57] @sebastianascimento - Pedido ${orderId} excluído com sucesso`);
    revalidatePath("/list/orders");
    
    return { 
      success: true, 
      error: false,
      message: `Pedido #${orderId} excluído com sucesso`
    };
  } catch (err) {
    console.error("[2025-03-14 15:47:57] @sebastianascimento - Erro ao excluir pedido:", err);
    
    // Verificar se é um erro específico do Prisma
    if (typeof err === 'object' && err !== null) {
      // @ts-ignore
      const prismaError = err.code;
      if (prismaError === 'P2025') {
        return { 
          success: false, 
          error: true, 
          message: "Pedido não encontrado ou já foi excluído" 
        };
      }
    }
    
    return { 
      success: false, 
      error: true, 
      message: "Erro ao excluir o pedido" 
    };
  }
};


export const createCustomer = async (
  currentState: CurrentState,
  data: CustomerSchema
) => {
  try {
    const companyId = await getCompanyId();
    
    // Verificar se já existe um cliente com o mesmo nome ou e-mail na mesma empresa
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: data.name },
          { email: data.email }
        ],
        companyId
      }
    });

    if (existingCustomer) {
      return { 
        success: false, 
        error: true, 
        message: existingCustomer.name === data.name 
          ? "Um cliente com este nome já existe" 
          : "Um cliente com este e-mail já existe" 
      };
    }

    // Criar o novo cliente
    await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        picture: data.picture || null,
        companyId  // Importante: Associar cliente à empresa
      },
    });

    revalidatePath("/list/clients");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro desconhecido" 
    };
  }
};

export const updateCustomer = async (
  currentState: CurrentState,
  data: CustomerSchema
) => {
  try {
    if (!data.id) {
      throw new Error("Customer ID is required for update");
    }
    
    // Validar propriedade do cliente
    await validateOwnership(prisma.customer, data.id);
    const companyId = await getCompanyId();
    
    // Verificar duplicatas apenas na mesma empresa
    if (data.name || data.email) {
      const duplicateCheck = await prisma.customer.findFirst({
        where: {
          OR: [
            data.name ? { name: data.name } : {},
            data.email ? { email: data.email } : {}
          ],
          NOT: { id: data.id },
          companyId
        }
      });
      
      if (duplicateCheck) {
        return { 
          success: false, 
          error: true, 
          message: duplicateCheck.name === data.name 
            ? "Este nome já está em uso por outro cliente" 
            : "Este e-mail já está em uso por outro cliente" 
        };
      }
    }

    // Atualizar o cliente
    await prisma.customer.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        picture: data.picture || null,
      },
    });

    revalidatePath("/list/customers");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro ao atualizar cliente" 
    };
  }
};

export const deleteCustomer = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  if (!id) {
    return { success: false, error: true, message: "ID do cliente não fornecido" };
  }
  
  try {
    const customerId = Number(id);
    
    // Validar propriedade do cliente
    await validateOwnership(prisma.customer, customerId);
    
    // Verificar se tem pedidos associados
    const customerWithOrders = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { orders: { take: 1 } }
    });
    
    if (customerWithOrders?.orders.length) {
      return {
        success: false,
        error: true,
        message: "Este cliente possui pedidos associados e não pode ser excluído"
      };
    }
    
    // Excluir o cliente
    await prisma.customer.delete({
      where: { id: customerId }
    });
    
    revalidatePath("/list/customers");
    return { success: true, error: false };
  } catch (err) {
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Erro ao excluir cliente" 
    };
  }
};

export async function createShipping(
  currentState: { success: boolean; error: boolean },
  data: ShippingSchema
): Promise<{ success: boolean; error: boolean; message?: string }> {
  try {
    // MULTI-TENANT: Obter ID da empresa do usuário
    const companyId = await getCompanyId();
    
    if (!companyId) {
      return {
        success: false,
        error: true,
        message: "Empresa não configurada. Configure sua empresa antes de continuar."
      };
    }
    
    console.log(`[2025-03-14 16:35:26] @sebastianascimento - Criando envio para empresa ${companyId}`);
    
    // Verificar se o estoque existe e pertence à empresa do usuário
    const stock = await prisma.stock.findFirst({
      where: {
        id: data.stockId,
        companyId // MULTI-TENANT: Verificação de propriedade
      },
      include: {
        product: true
      }
    });
    
    if (!stock) {
      return {
        success: false,
        error: true,
        message: "Estoque não encontrado ou não pertence à sua empresa"
      };
    }
    
    // Verificar se o produto no estoque corresponde ao produto selecionado
    if (stock.productId !== data.productId) {
      return {
        success: false,
        error: true,
        message: "O estoque selecionado não corresponde ao produto"
      };
    }
    
    // Verificar se há estoque disponível
    if (stock.stockLevel <= 0) {
      return {
        success: false,
        error: true,
        message: "Estoque insuficiente para criar envio"
      };
    }

    // Criar envio
    const shipping = await prisma.shipping.create({
      data: {
        name: data.name,
        status: data.status,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        stockId: data.stockId,
        productId: data.productId,
        companyId // MULTI-TENANT: Associar à empresa do usuário
      },
    });
    
    // Diminuir o nível de estoque em 1 (opcional - depende da regra de negócio)
    await prisma.stock.update({
      where: { id: data.stockId },
      data: {
        stockLevel: {
          decrement: 1
        }
      }
    });
    
    console.log(`[2025-03-14 16:35:26] @sebastianascimento - Envio criado com ID: ${shipping.id}`);
    
    revalidatePath("/list/shippings");
    revalidatePath("/list/stocks");
    
    return {
      success: true,
      error: false,
      message: "Envio criado com sucesso"
    };
  } catch (error) {
    console.error("[2025-03-14 16:35:26] @sebastianascimento - Erro ao criar envio:", error);
    
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Erro ao criar envio"
    };
  }
}

export async function updateShipping(
  currentState: { success: boolean; error: boolean },
  data: ShippingSchema
): Promise<{ success: boolean; error: boolean; message?: string }> {
  if (!data.id) {
    return {
      ...currentState,
      error: true,
      message: "ID do envio é necessário para atualização"
    };
  }
  
  try {
    // MULTI-TENANT: Obter ID da empresa do usuário
    const companyId = await getCompanyId();
    
    if (!companyId) {
      return {
        success: false,
        error: true,
        message: "Empresa não configurada. Configure sua empresa antes de continuar."
      };
    }
    
    console.log(`[2025-03-14 16:35:26] @sebastianascimento - Atualizando envio ${data.id} para empresa ${companyId}`);
    
    // Verificar se o envio existe e pertence à empresa do usuário
    const existingShipping = await prisma.shipping.findFirst({
      where: {
        id: data.id,
        companyId // MULTI-TENANT: Verificação de propriedade
      }
    });
    
    if (!existingShipping) {
      return {
        success: false,
        error: true,
        message: "Envio não encontrado ou não pertence à sua empresa"
      };
    }
    
    // Se o stock está sendo alterado, verificações adicionais são necessárias
    if (data.stockId !== existingShipping.stockId) {
      // Verificar se o novo estoque existe e pertence à empresa
      const newStock = await prisma.stock.findFirst({
        where: {
          id: data.stockId,
          companyId
        }
      });
      
      if (!newStock) {
        return {
          success: false,
          error: true,
          message: "Novo estoque não encontrado ou não pertence à sua empresa"
        };
      }
      
      // Verificar se o produto no novo estoque corresponde ao produto selecionado
      if (newStock.productId !== data.productId) {
        return {
          success: false,
          error: true,
          message: "O estoque selecionado não corresponde ao produto"
        };
      }
      
      // Verificar se há estoque disponível
      if (newStock.stockLevel <= 0) {
        return {
          success: false,
          error: true,
          message: "Estoque insuficiente para atribuir ao envio"
        };
      }
      
      // Decrementar o novo estoque e incrementar o antigo
      await prisma.$transaction([
        prisma.stock.update({
          where: { id: data.stockId },
          data: {
            stockLevel: {
              decrement: 1
            }
          }
        }),
        prisma.stock.update({
          where: { id: existingShipping.stockId },
          data: {
            stockLevel: {
              increment: 1
            }
          }
        })
      ]);
    }
    
    // Atualizar o envio
    const updatedShipping = await prisma.shipping.update({
      where: { id: data.id },
      data: {
        name: data.name,
        status: data.status,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        stockId: data.stockId,
        productId: data.productId
        // Não atualizamos companyId para evitar alteração entre empresas
      }
    });
    
    console.log(`[2025-03-14 16:35:26] @sebastianascimento - Envio atualizado: ${updatedShipping.id}`);
    
    revalidatePath("/list/shippings");
    revalidatePath("/list/stocks");
    
    return {
      success: true,
      error: false,
      message: "Envio atualizado com sucesso"
    };
  } catch (error) {
    console.error("[2025-03-14 16:35:26] @sebastianascimento - Erro ao atualizar envio:", error);
    
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Erro ao atualizar envio"
    };
  }
}

export async function deleteShipping(
  id: string | number
): Promise<{ success: boolean; error: boolean; message?: string }> {
  try {
    if (!id) {
      return {
        success: false,
        error: true,
        message: "ID do envio é necessário para exclusão"
      };
    }
    
    // Converter para número se for string
    const shippingId = typeof id === 'string' ? parseInt(id) : id;
    
    // MULTI-TENANT: Obter ID da empresa do usuário
    const companyId = await getCompanyId();
    
    if (!companyId) {
      return {
        success: false,
        error: true,
        message: "Empresa não configurada. Configure sua empresa antes de continuar."
      };
    }
    
    console.log(`[2025-03-21 14:35:26] @sebastianascimento - Excluindo envio ${shippingId} para empresa ${companyId}`);
    
    // Verificar se o envio existe e pertence à empresa do usuário
    const existingShipping = await prisma.shipping.findFirst({
      where: {
        id: shippingId,
        companyId // MULTI-TENANT: Verificação de propriedade
      },
      include: {
        stock: true
      }
    });
    
    if (!existingShipping) {
      return {
        success: false,
        error: true,
        message: "Envio não encontrado ou não pertence à sua empresa"
      };
    }
    
    // Incrementar o estoque associado, já que o item está sendo "devolvido"
    if (existingShipping.stockId) {
      await prisma.stock.update({
        where: { id: existingShipping.stockId },
        data: {
          stockLevel: {
            increment: 1
          }
        }
      });
    }
    
    // Excluir o envio
    await prisma.shipping.delete({
      where: { id: shippingId }
    });
    
    console.log(`[2025-03-21 14:35:26] @sebastianascimento - Envio excluído: ${shippingId}`);
    
    revalidatePath("/list/shippings");
    revalidatePath("/list/stocks");
    revalidatePath("/list/logistics");
    
    return {
      success: true,
      error: false,
      message: "Envio excluído com sucesso"
    };
  } catch (error) {
    console.error("[2025-03-21 14:35:26] @sebastianascimento - Erro ao excluir envio:", error);
    
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Erro ao excluir envio"
    };
  }
}

export async function createStock(
  currentState: { success: boolean; error: boolean },
  data: StockSchema & { newSupplierName?: string }  // Allow for a new supplier name
): Promise<{ success: boolean; error: boolean; message?: string }> {
  try {
    // Updated timestamp and username
    const timestamp = "2025-03-21 19:35:00";
    const username = "sebastianascimento";
    
    // MULTI-TENANT: Get user's company ID
    const companyId = await getServerSession(authOptions)
      .then(session => session?.user?.companyId || null);
    
    console.log(`[${timestamp}] @${username} - Creating stock, companyId: ${companyId}`);
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });
    
    if (!product) {
      return {
        success: false,
        error: true,
        message: "Produto não encontrado"
      };
    }
    
    // Handle supplier - either use existing or create new one
    let supplierId = data.supplierId;
    
    // If a new supplier name is provided, create the supplier
    if (data.newSupplierName && (!supplierId || supplierId === 0)) {
      console.log(`[${timestamp}] @${username} - Creating new supplier: ${data.newSupplierName}`);
      
      // Create new supplier with proper type handling for companyId
      const supplierData: any = {
        name: data.newSupplierName,
        contactInfo: `Contact for ${data.newSupplierName}`
      };
      
      // Only add companyId if it's not null/undefined
      if (companyId) {
        // Use connect syntax for the relation instead of direct assignment
        supplierData.company = {
          connect: { id: companyId }
        };
      }
      
      const newSupplier = await prisma.supplier.create({
        data: supplierData
      });
      
      console.log(`[${timestamp}] @${username} - New supplier created with ID: ${newSupplier.id}`);
      supplierId = newSupplier.id;
    } else {
      // Verify existing supplier
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });
      
      if (!supplier) {
        return {
          success: false,
          error: true,
          message: "Fornecedor não encontrado"
        };
      }
      
      // If supplier doesn't have a company ID, assign it
      if (supplier && companyId && !supplier.companyId) {
        console.log(`[${timestamp}] @${username} - Associating supplier ${supplier.id} with company ${companyId}`);
        
        await prisma.supplier.update({
          where: { id: supplier.id },
          data: { 
            company: {
              connect: { id: companyId }
            }
          }
        });
      }
    }

    // Create stock record with proper relation syntax
    // THIS IS THE KEY CHANGE - Use relation objects instead of direct IDs
    const stockData: any = {
      stockLevel: data.stockLevel,
      
      // Use relation connections instead of IDs
      product: {
        connect: { id: data.productId }
      },
      supplier: {
        connect: { id: supplierId }
      }
    };
    
    // Use connect syntax for company relation
    if (companyId) {
      stockData.company = {
        connect: { id: companyId }
      };
    }
    
    console.log(`[${timestamp}] @${username} - Creating stock with data:`, stockData);
    
    const newStock = await prisma.stock.create({ data: stockData });
    
    console.log(`[${timestamp}] @${username} - Stock created successfully, ID: ${newStock.id}`);
    
    revalidatePath("/list/products");
    revalidatePath("/logistics");
    
    return {
      success: true,
      error: false,
      message: "Estoque criado com sucesso"
    };
  } catch (error) {
    const timestamp = "2025-03-21 19:35:00";
    const username = "sebastianascimento";
    console.error(`[${timestamp}] @${username} - Error creating stock:`, error);
    
    return {
      success: false,
      error: true,
      message: "Falha ao criar registro de estoque: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

export async function updateStock(
  currentState: { success: boolean; error: boolean },
  data: StockSchema & { newSupplierName?: string }  // Allow for a new supplier name
): Promise<{ success: boolean; error: boolean; message?: string }> {
  if (!data.id) {
    return {
      ...currentState,
      error: true,
      message: "ID do estoque não fornecido"
    };
  }
  
  try {
    const timestamp = "2025-03-21 20:52:54";
    const username = "sebastianascimento";
    
    console.log(`[${timestamp}] @${username} - Updating stock ID ${data.id}`);
    
    // MULTI-TENANT: Get user's company ID
    const companyId = await getServerSession(authOptions)
      .then(session => session?.user?.companyId || null);
    
    console.log(`[${timestamp}] @${username} - User company ID: ${companyId || 'none'}`);
    
    // MULTI-TENANT: Verify the stock belongs to the user's company
    const existingStock = await prisma.stock.findFirst({
      where: {
        id: data.id,
        ...(companyId ? { companyId } : {})
      }
    });
    
    if (!existingStock) {
      return {
        success: false,
        error: true,
        message: "Registro de estoque não encontrado ou não pertence à sua empresa"
      };
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });
    
    if (!product) {
      return {
        success: false,
        error: true,
        message: "Produto não encontrado"
      };
    }
    
    // Handle supplier - either use existing or create new one
    let supplierId = data.supplierId;
    
    // If a new supplier name is provided, create the supplier
    if (data.newSupplierName && (!supplierId || supplierId === 0)) {
      console.log(`[${timestamp}] @${username} - Creating new supplier during stock update: ${data.newSupplierName}`);
      
      // Create new supplier with proper type handling for companyId
      const supplierData: any = {
        name: data.newSupplierName,
        contactInfo: `Contact for ${data.newSupplierName}`
      };
      
      // Only add companyId if it's not null/undefined
      if (companyId) {
        // Use connect syntax for the relation instead of direct assignment
        supplierData.company = {
          connect: { id: companyId }
        };
      }
      
      const newSupplier = await prisma.supplier.create({
        data: supplierData
      });
      
      console.log(`[${timestamp}] @${username} - New supplier created with ID: ${newSupplier.id}`);
      supplierId = newSupplier.id;
    } else {
      // Verify existing supplier
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });
      
      if (!supplier) {
        return {
          success: false,
          error: true,
          message: "Fornecedor não encontrado"
        };
      }
      
      // If supplier doesn't have a company ID, assign it
      if (supplier && companyId && !supplier.companyId) {
        console.log(`[${timestamp}] @${username} - Associating supplier ${supplier.id} with company ${companyId}`);
        
        await prisma.supplier.update({
          where: { id: supplier.id },
          data: { 
            company: {
              connect: { id: companyId }
            }
          }
        });
      }
    }
    
    // Prepare update data with proper relation syntax
    const updateData: any = {
      stockLevel: data.stockLevel,
      
      // Use relation syntax instead of direct IDs
      product: {
        connect: { id: data.productId }
      },
      supplier: {
        connect: { id: supplierId }
      }
    };
    
    console.log(`[${timestamp}] @${username} - Updating stock with data:`, updateData);
    
    // Update stock with relation syntax
    await prisma.stock.update({
      where: { id: data.id },
      data: updateData
    });
    
    console.log(`[${timestamp}] @${username} - Stock updated successfully`);
    
    revalidatePath("/list/products");
    revalidatePath("/logistics");
    
    return {
      success: true,
      error: false,
      message: "Estoque atualizado com sucesso"
    };
  } catch (error) {
    const timestamp = "2025-03-21 20:52:54";
    const username = "sebastianascimento";
    console.error(`[${timestamp}] @${username} - Error updating stock:`, error);
    
    return {
      success: false,
      error: true,
      message: "Falha ao atualizar registro de estoque: " + (error instanceof Error ? error.message : String(error))
    };
  }
}


export async function deleteStock(
  currentState: { success: boolean; error: boolean },
  data: FormData
): Promise<{ success: boolean; error: boolean; message?: string }> {
  const id = data.get('id');
  
  if (!id) {
    return {
      ...currentState,
      error: true,
      message: "ID do estoque não fornecido"
    };
  }
  
  const stockId = Number(id);
  
  if (isNaN(stockId)) {
    return {
      ...currentState,
      error: true,
      message: "ID do estoque inválido"
    };
  }
  
  try {
    // MULTI-TENANT: Obter ID da empresa do usuário
    const companyId = await getCompanyId();
    
    if (!companyId) {
      return {
        success: false,
        error: true,
        message: "Empresa não configurada"
      };
    }
    
    console.log(`[2025-03-14 16:17:13] @sebastianascimento - Excluindo estoque ${stockId} para empresa ${companyId}`);
    
    // MULTI-TENANT: Verificar se o registro de estoque pertence à empresa do usuário
    const existingStock = await prisma.stock.findFirst({
      where: {
        id: stockId,
        companyId
      }
    });
    
    if (!existingStock) {
      return {
        success: false,
        error: true,
        message: "Registro de estoque não encontrado ou não pertence à sua empresa"
      };
    }
    
    // Excluir o registro
    await prisma.stock.delete({
      where: { id: stockId }
    });
    
    revalidatePath("/list/products");
    revalidatePath("/logistics");
    
    return {
      success: true,
      error: false,
      message: "Registro de estoque excluído com sucesso"
    };
  } catch (error) {
    console.error("[2025-03-14 16:17:13] @sebastianascimento - Erro ao excluir estoque:", error);
    
    // Verificar se há erros específicos do Prisma
    if (typeof error === 'object' && error !== null) {
      // @ts-ignore
      const prismaError = error.code;
      // Se houver registros relacionados que impedem a exclusão
      if (prismaError === 'P2003') {
        return {
          success: false,
          error: true,
          message: "Este registro de estoque está sendo usado por outros registros e não pode ser excluído"
        };
      }
    }
    
    return {
      success: false,
      error: true,
      message: "Falha ao excluir registro de estoque"
    };
  }
}

async function listEntityByCompany(
  model: any, 
  options: { 
    orderBy?: Record<string, string>, 
    include?: Record<string, boolean>,
    where?: Record<string, any>
  } = {}
) {
  try {
    const companyId = await getCompanyId();
    
    const entities = await model.findMany({
      where: { 
        ...options.where,
        companyId 
      },
      orderBy: options.orderBy || { name: 'asc' },
      include: options.include
    });
    
    return { success: true, data: entities };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: `Erro ao listar entidades: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      data: []
    };
  }
}

// Implementações simplificadas das funções de listagem
export async function listCategories() {
  return listEntityByCompany(prisma.category);
}

export async function listBrands() {
  return listEntityByCompany(prisma.brand);
}

export async function listSuppliers() {
  return listEntityByCompany(prisma.supplier);
}

export async function listCustomers() {
  return listEntityByCompany(prisma.customer);
}

