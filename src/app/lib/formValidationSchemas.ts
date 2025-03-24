import { z } from "zod";

// [2025-03-13 15:28:28] - sebastianascimento

export const productSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(3, { message: "Product name must be at least 3 characters long!" }).max(50, { message: "Product name must be at most 50 characters long!" }),
  description: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number!" }),
  categoryName: z.string().min(1, { message: "Category name is required!" }),
  brandName: z.string().min(1, { message: "Brand name is required!" }),
  supplierName: z.string().min(1, { message: "Supplier name is required!" }),
  imageUrl: z.string().url().optional(),
  supplierContactInfo: z.string().optional(),
  info: z.string().optional(),
  companyId: z.string().optional(), 
});

export type ProductSchema = z.infer<typeof productSchema>;

export const orderSchema = z.object({
  id: z.coerce.number().optional(),
  product: z.string().min(3, { message: "Product name is required!" }),
  customer: z.string().min(3, { message: "Customer name is required!" }),
  address: z.string().min(3, { message: "Address is required!" }).default("Default Address"),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1!" }),
  status: z.enum(["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]).default("PENDING"),
  companyId: z.string().optional(), 
});

export type OrderSchema = z.infer<typeof orderSchema>;

export const customerSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(3, { message: "Customer name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  address: z.string().min(5, { message: "Address is required (min 5 characters)!" }),
  picture: z.string().url({ message: "Picture must be a valid URL!" }).optional().or(z.literal("")),
  companyId: z.string().optional(), 
});

export type CustomerSchema = z.infer<typeof customerSchema>;

export const shippingSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(3, { message: "Shipping name is required!" }),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).default("PENDING"),
  carrier: z.string().min(2, { message: "Carrier name is required!" }),
  estimatedDelivery: z.date().default(() => {
    // Por padrão, 7 dias a partir de hoje
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }),
  stockId: z.coerce.number().min(1, { message: "Stock selection is required!" }),
  productId: z.coerce.number().min(1, { message: "Product selection is required!" }),
  companyId: z.string().optional(), // Campo adicionado para relacionamento com empresa
});

export type ShippingSchema = z.infer<typeof shippingSchema>;

export const stockSchema = z.object({
  id: z.coerce.number().optional(),
  productId: z.coerce.number({
    message: "Product ID is required",
  }),
  stockLevel: z.coerce.number({
    message: "Stock level is required",
  }).min(0, {
    message: "Stock level cannot be negative",
  }),
  supplierId: z.coerce.number({
    message: "Supplier ID is required",
  }),
  companyId: z.string().optional(),
  supplierName: z.string().optional(),
});

export type StockSchema = z.infer<typeof stockSchema>;

export const supplierSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(3, { message: "Supplier name is required!" }),
  contact: z.string().optional().or(z.literal("")),
  companyId: z.string().optional(), // Campo adicionado para relacionamento com empresa
});

export type SupplierSchema = z.infer<typeof supplierSchema>;