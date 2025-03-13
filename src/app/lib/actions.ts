"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import {  CustomerSchema, OrderSchema, ProductSchema, ShippingSchema, StockSchema,} from "./formValidationSchemas";

type CurrentState = { success: boolean; error: boolean ; message?: string;};

type ActionResult = { 
  success: boolean; 
  error: boolean;
  message?: string;
};

export const createProduct = async (
  currentState: CurrentState,
  data: ProductSchema
) => {
  try {
    await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: {
          connectOrCreate: {
            where: { name: data.categoryName },
            create: { name: data.categoryName }
          },
        },
        brand: {
          connectOrCreate: {
            where: { name: data.brandName },
            create: { name: data.brandName }
          },
        },
        supplier: {
          connectOrCreate: {
            where: { name: data.supplierName } as any,
            create: { 
              name: data.supplierName,
              contactInfo: data.supplierContactInfo || `Contact info for ${data.supplierName}`
            }
          },
        },
      },
    });

    revalidatePath("/list/products");
    currentState.success = true;
    currentState.error = false;
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
  }
};


export const updateProduct = async (
  currentState: CurrentState,
  data: ProductSchema
) => {
  try {
    if (!data.id) {
      throw new Error("Product ID is required for update");
    }
    
    console.log(`Updating product with ID: ${data.id}`);

    await prisma.product.update({
      where: {
        id: data.id, 
      },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: {
          connectOrCreate: {
            where: { name: data.categoryName },
            create: { name: data.categoryName }
          },
        },
        brand: {
          connectOrCreate: {
            where: { name: data.brandName },
            create: { name: data.brandName }
          },
        },
        supplier: {
          connectOrCreate: {
            where: { name: data.supplierName } as any,
            create: { 
              name: data.supplierName,
              contactInfo: data.supplierContactInfo || `Contact info for ${data.supplierName}`
            }
          },
        },
      },
    });

    revalidatePath("/list/products");
    return { success: true, error: false };
  } catch (err) {
    console.log("Error in updateProduct:", err);
    return { success: false, error: true };
  }
};

export const deleteProduct = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  if (!id) {
    console.error("No ID provided for product deletion");
    return { success: false, error: true };
  }
  
  try {
    console.log(`Deleting product with ID: ${id}`);
    await prisma.product.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/products");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting product:", err);
    return { success: false, error: true };
  }
};


export const createOrder = async (
  currentState: CurrentState,
  data: OrderSchema
) => {
  try {
    // --- Primeiro, encontre ou crie o produto ---
    let productId: number;
    const existingProduct = await prisma.product.findFirst({
      where: { name: data.product }
    });

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      // --- Se precisamos criar um produto, precisamos primeiro tratar das relações ---
      
      // 1. Encontrar ou criar categoria
      let categoryId: number | undefined;
      const categoryName = "Default Category";
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryName }
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.category.create({
          data: { name: categoryName }
        });
        categoryId = newCategory.id;
      }
      
      // 2. Encontrar ou criar marca
      let brandId: number | undefined;
      const brandName = "Default Brand";
      const existingBrand = await prisma.brand.findFirst({
        where: { name: brandName }
      });
      
      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const newBrand = await prisma.brand.create({
          data: { name: brandName }
        });
        brandId = newBrand.id;
      }
      
      // 3. Encontrar ou criar fornecedor
      let supplierId: number | undefined;
      const supplierName = "Default Supplier";
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: supplierName }
      });
      
      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else {
        const newSupplier = await prisma.supplier.create({
          data: { 
            name: supplierName,
            contactInfo: "Default Contact Info"
          }
        });
        supplierId = newSupplier.id;
      }
      
      // Agora crie o produto com todas as relações por ID
      const newProduct = await prisma.product.create({
        data: {
          name: data.product,
          description: "",
          price: 0,
          categoryId,
          brandId,
          supplierId
        }
      });
      
      productId = newProduct.id;
    }

    // --- Encontre ou crie o cliente ---
    let customerId: number;
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: data.customer }
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          name: data.customer,
          email: `${data.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          address: data.address || "Default Address",
        }
      });
      customerId = newCustomer.id;
    }

    await prisma.order.create({
      data: {
        quantity: data.quantity,
        address: data.address || "Default Address",
        status: data.status as any,  
        productId,  
        customerId  
      },
    });

    revalidatePath("/list/orders");
    currentState.success = true;
    currentState.error = false;
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
  }
};

export const updateOrder = async (
  currentState: CurrentState,
  data: OrderSchema
) => {
  try {
    if (!data.id) {
      throw new Error("Order ID is required for update");
    }

    let productId: number;
    const existingProduct = await prisma.product.findFirst({
      where: { name: data.product }
    });

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      
      // 1. Encontrar ou criar categoria
      let categoryId: number | undefined;
      const categoryName = "Default Category";
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryName }
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.category.create({
          data: { name: categoryName }
        });
        categoryId = newCategory.id;
      }
      
      // 2. Encontrar ou criar marca
      let brandId: number | undefined;
      const brandName = "Default Brand";
      const existingBrand = await prisma.brand.findFirst({
        where: { name: brandName }
      });
      
      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const newBrand = await prisma.brand.create({
          data: { name: brandName }
        });
        brandId = newBrand.id;
      }
      
      // 3. Encontrar ou criar fornecedor
      let supplierId: number | undefined;
      const supplierName = "Default Supplier";
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: supplierName }
      });
      
      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else {
        const newSupplier = await prisma.supplier.create({
          data: { 
            name: supplierName,
            contactInfo: "Default Contact Info"
          }
        });
        supplierId = newSupplier.id;
      }
      
      // Agora crie o produto com todas as relações por ID
      const newProduct = await prisma.product.create({
        data: {
          name: data.product,
          description: "",
          price: 0,
          categoryId,
          brandId,
          supplierId
        }
      });
      
      productId = newProduct.id;
    }

    // --- Encontre ou crie o cliente ---
    let customerId: number;
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: data.customer }
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          name: data.customer,
          email: `${data.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          address: data.address || "Default Address",
        }
      });
      customerId = newCustomer.id;
    }

    // --- Agora atualize o pedido existente ---
    await prisma.order.update({
      where: {
        id: data.id
      },
      data: {
        quantity: data.quantity,
        address: data.address || "Default Address",
        status: data.status as any,  // Convertemos para o enum
        productId,  // Conecta diretamente usando o ID
        customerId  // Conecta diretamente usando o ID
      },
    });

    revalidatePath("/list/orders");
    currentState.success = true;
    currentState.error = false;
    return currentState;
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
    return currentState;
  }
};

export const deleteOrder = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  console.log("Tentando excluir pedido - ID recebido:", id, "Tipo:", typeof id);
  
  if (!id) {
    console.error("No ID provided for order deletion");
    return { success: false, error: true, message: "ID do pedido não fornecido" };
  }
  
  try {
    // Certifique-se que o ID é um número
    const orderId = Number(id);
    
    if (isNaN(orderId)) {
      console.error(`Invalid order ID: ${id} is not a number`);
      return { success: false, error: true, message: "ID do pedido inválido" };
    }
    
    // Verificar se o pedido existe
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!orderExists) {
      console.error(`Order with ID ${orderId} does not exist`);
      return { success: false, error: true, message: "Pedido não encontrado" };
    }
    
    console.log(`Encontrado pedido com ID ${orderId}, prosseguindo com exclusão`);
    
    // Agora que confirmamos que o pedido existe, vamos excluí-lo
    await prisma.order.delete({
      where: { id: orderId }
    });
    
    console.log(`Pedido ${orderId} excluído com sucesso`);
    revalidatePath("/list/orders");
    return { success: true, error: false };
    
  } catch (err) {
    console.error("Erro detalhado ao excluir pedido:", err);
    
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
    
    return { success: false, error: true, message: "Erro ao excluir o pedido" };
  }
};

export const createCustomer = async (
  currentState: { success: boolean; error: boolean },
  data: CustomerSchema
) => {
  try {
    // Verificar se já existe um cliente com o mesmo nome ou e-mail
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: data.name },
          { email: data.email }
        ]
      }
    });

    if (existingCustomer) {
      console.log(`Customer with name "${data.name}" or email "${data.email}" already exists`);
      currentState.success = false;
      currentState.error = true;
      return { 
        ...currentState, 
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
        picture: data.picture || null,  // Usar null se não houver imagem
      },
    });

    console.log(`Customer "${data.name}" created successfully`);
    revalidatePath("/list/customers");
    currentState.success = true;
    currentState.error = false;
    return currentState;
  } catch (err) {
    console.error("Error creating customer:", err);
    currentState.success = false;
    currentState.error = true;
    return { ...currentState, message: "Erro ao criar cliente" };
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
    
    // Verificar se o cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: data.id }
    });
    
    if (!existingCustomer) {
      console.error(`Customer with ID ${data.id} not found`);
      currentState.success = false;
      currentState.error = true;
      return { ...currentState, message: "Cliente não encontrado" };
    }
    
    // Verificar se o nome ou email já está em uso por outro cliente
    if (existingCustomer.name !== data.name || existingCustomer.email !== data.email) {
      const duplicateCheck = await prisma.customer.findFirst({
        where: {
          OR: [
            { name: data.name },
            { email: data.email }
          ],
          NOT: { id: data.id }
        }
      });
      
      if (duplicateCheck) {
        console.log(`Name "${data.name}" or email "${data.email}" already in use by another customer`);
        currentState.success = false;
        currentState.error = true;
        return { 
          ...currentState, 
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

    console.log(`Customer ${data.id} updated successfully`);
    revalidatePath("/list/customers");
    currentState.success = true;
    currentState.error = false;
    return currentState;
  } catch (err) {
    console.error("Error updating customer:", err);
    currentState.success = false;
    currentState.error = true;
    return { ...currentState, message: "Erro ao atualizar cliente" };
  }
};

export const deleteCustomer = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  if (!id) {
    console.error("No ID provided for customer deletion");
    return { success: false, error: true, message: "ID do cliente não fornecido" };
  }
  
  try {
    const customerId = Number(id);
    
    if (isNaN(customerId)) {
      return { success: false, error: true, message: "ID do cliente inválido" };
    }
    
    // Verificar se o cliente tem pedidos associados
    const customerWithOrders = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { orders: { take: 1 } }
    });
    
    if (!customerWithOrders) {
      return { success: false, error: true, message: "Cliente não encontrado" };
    }
    
    // Se o cliente tem pedidos, não permitir a exclusão
    if (customerWithOrders.orders.length > 0) {
      return { 
        success: false, 
        error: true, 
        message: "Este cliente possui pedidos associados e não pode ser excluído" 
      };
    }
    
    // Se não tem pedidos, podemos excluir
    await prisma.customer.delete({
      where: { id: customerId }
    });
    
    console.log(`Customer ${customerId} deleted successfully`);
    revalidatePath("/list/customers");
    return { success: true, error: false };
    
  } catch (err) {
    console.error("Error deleting customer:", err);
    return { success: false, error: true, message: "Erro ao excluir o cliente" };
  }
};


export async function createStock(
  currentState: { success: boolean; error: boolean },
  data: StockSchema
): Promise<{ success: boolean; error: boolean; message?: string }> {
  try {
    await prisma.stock.create({
      data: {
        product: { connect: { id: data.productId } },
        stockLevel: data.stockLevel,
        supplier: { connect: { id: data.supplierId } },
      },
    });
    
    return {
      success: true,
      error: false,
      message: "Stock created successfully"
    };
  } catch (error) {
    console.error("Error creating stock:", error);
    return {
      success: false,
      error: true,
      message: "Failed to create stock record."
    };
  }
}

export async function updateStock(
  currentState: { success: boolean; error: boolean },
  data: StockSchema
): Promise<{ success: boolean; error: boolean; message?: string }> {
  if (!data.id) {
    return {
      ...currentState,
      error: true,
      message: "Missing stock ID"
    };
  }
  
  try {
    await prisma.stock.update({
      where: { id: data.id },
      data: {
        product: { connect: { id: data.productId } },
        stockLevel: data.stockLevel,
        supplier: { connect: { id: data.supplierId } },
      },
    });
    
    return {
      success: true,
      error: false,
      message: "Stock updated successfully"
    };
  } catch (error) {
    console.error("Error updating stock:", error);
    return {
      success: false,
      error: true,
      message: "Failed to update stock record."
    };
  }
}

export const createShipping = async (
  currentState: CurrentState,
  data: ShippingSchema
) => {
  const currentDate = "2025-03-11 15:00:11";
  const currentUser = "sebastianascimento";
  console.log(`[${currentDate}] ${currentUser} is creating shipping: ${data.name}`);

  try {
    // Validar dados básicos
    if (!data.name || !data.carrier || !data.stockId || !data.productId) {
      throw new Error("Missing required shipping information");
    }

    // Garantir que temos uma data de entrega estimada válida
    const estimatedDelivery = data.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Criar o envio com os campos necessários (sem employees)
    const shipping = await prisma.shipping.create({
      data: {
        name: data.name,
        status: data.status,
        carrier: data.carrier,
        estimatedDelivery: estimatedDelivery, // Agora garantimos que é uma data válida
        stockId: data.stockId,
        productId: data.productId
      }
    });
    
    revalidatePath("/list/shippings");
    currentState.success = true;
    currentState.error = false;
    currentState.message = "Shipping created successfully";
    
    return shipping.id;
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
    currentState.message = err instanceof Error ? err.message : "Failed to create shipping";
    return null;
  }
};

// Função simplificada para atualizar um envio
export const updateShipping = async (
  currentState: CurrentState,
  data: ShippingSchema
) => {
  const currentDate = "2025-03-11 15:00:11";
  const currentUser = "sebastianascimento";
  console.log(`[${currentDate}] ${currentUser} is updating shipping ID: ${data.id}`);

  if (!data.id) {
    currentState.success = false;
    currentState.error = true;
    currentState.message = "Missing shipping ID";
    return;
  }
  
  try {
    // Verificar se o envio existe
    const shipping = await prisma.shipping.findUnique({
      where: { id: data.id }
    });
    
    if (!shipping) {
      throw new Error("Shipping not found");
    }
    
    // Garantir que temos uma data de entrega estimada válida
    const estimatedDelivery = data.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Atualizar dados básicos do envio (sem tratar employees)
    await prisma.shipping.update({
      where: { id: data.id },
      data: {
        name: data.name,
        status: data.status,
        carrier: data.carrier,
        estimatedDelivery: estimatedDelivery, // Agora garantimos que é uma data válida
        stockId: data.stockId,
        productId: data.productId
      }
    });
    
    revalidatePath("/list/shippings");
    currentState.success = true;
    currentState.error = false;
    currentState.message = "Shipping updated successfully";
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
    currentState.message = err instanceof Error ? err.message : "Failed to update shipping";
  }
};

// Função de exclusão permanece a mesma
export const deleteShipping = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const currentDate = "2025-03-11 15:00:11";
  const currentUser = "sebastianascimento";
  const shippingId = Number(formData.get("id"));
  console.log(`[${currentDate}] ${currentUser} is deleting shipping ID: ${shippingId}`);

  if (isNaN(shippingId)) {
    currentState.success = false;
    currentState.error = true;
    currentState.message = "Invalid shipping ID";
    return;
  }
  
  try {
    // Verificar se o envio existe
    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId }
    });
    
    if (!shipping) {
      throw new Error("Shipping not found");
    }
    
    // Excluir o envio
    await prisma.shipping.delete({
      where: { id: shippingId }
    });
    
    revalidatePath("/list/shippings");
    currentState.success = true;
    currentState.error = false;
    currentState.message = "Shipping deleted successfully";
  } catch (err) {
    console.log(err);
    currentState.success = false;
    currentState.error = true;
    currentState.message = err instanceof Error ? err.message : "Failed to delete shipping";
  }
};