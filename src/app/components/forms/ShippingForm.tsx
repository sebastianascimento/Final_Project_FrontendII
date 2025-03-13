"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { shippingSchema } from "@/app/lib/formValidationSchemas";
import { z } from "zod";
import { createShipping, updateShipping } from "@/app/lib/actions";

type ShippingInputs = z.infer<typeof shippingSchema>;

interface Product {
  id: number;
  name: string;
  price?: number | null;
}

interface Stock {
  id: number;
  productId: number;
  stockLevel: number;
  product?: {
    name: string;
  };
}

interface ShippingFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ShippingForm = ({ type, data, setOpen }: ShippingFormProps) => {
  const currentDate = "2025-03-11 15:02:28";
  const currentUser = "sebastianascimento";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({ 
    success: false, 
    error: false,
    errorMessage: ""
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  
  // Buscar dados necessários
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Produtos
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          setProducts(await productsRes.json());
        } else {
          console.error("Failed to fetch products");
          setProducts([]);
        }
        
        // Estoques
        const stocksRes = await fetch('/api/stocks');
        if (stocksRes.ok) {
          setStocks(await stocksRes.json());
        } else {
          console.error("Failed to fetch stocks");
          setStocks([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShippingInputs>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: "",
      status: "PENDING",
      carrier: "",
      estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 7)),
      productId: 0,
      stockId: 0
    }
  });
  
  const selectedProductId = watch("productId");
  
  // Filtrar estoques com base no produto selecionado
  useEffect(() => {
    if (selectedProductId) {
      const filtered = stocks.filter(stock => stock.productId === Number(selectedProductId));
      setFilteredStocks(filtered);
      
      // Se não houver mais estoque disponível, limpar a seleção
      if (filtered.length === 0) {
        setValue("stockId", 0);
      }
      // Se houver apenas um estoque, selecioná-lo automaticamente
      else if (filtered.length === 1) {
        setValue("stockId", filtered[0].id);
      }
    } else {
      setFilteredStocks([]);
    }
  }, [selectedProductId, stocks, setValue]);
  
  // Carregar dados para edição
  useEffect(() => {
    if (type === "update" && data) {
      console.log("Setting form data for update:", data);
      const estimatedDate = data.estimatedDelivery 
        ? new Date(data.estimatedDelivery) 
        : new Date(new Date().setDate(new Date().getDate() + 7));
        
      reset({
        id: data.id,
        name: data.name || "",
        status: data.status || "PENDING",
        carrier: data.carrier || "",
        estimatedDelivery: estimatedDate,
        stockId: data.stockId || 0,
        productId: data.productId || 0
      });
    }
  }, [data, reset, type]);
  
  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });
    
    console.log(`[${currentDate}] ${currentUser} submitting shipping form:`, formData);
    
    try {
      if (type === "create") {
        await createShipping({ success: false, error: false }, formData);
      } else if (type === "update") {
        if (!formData.id) {
          throw new Error("Missing shipping ID for update");
        }
        await updateShipping({ success: false, error: false }, formData);
      }
      
      setFormState({ success: true, error: false, errorMessage: "" });
      
      // Fechar o modal após sucesso
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error submitting shipping form:", error);
      setFormState({ 
        success: false, 
        error: true, 
        errorMessage: error instanceof Error ? error.message : "Unexpected error occurred" 
      });
    } finally {
      setIsSubmitting(false);
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Formatar a data para o formato aceito pelo input type="date"
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Obter a data estimada padrão (7 dias a partir de hoje)
  const getDefaultEstimatedDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return formatDateForInput(date);
  };
  
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Shipping" : "Update Shipping"}
      </h1>

      {formState.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Shipping {type === "create" ? "created" : "updated"} successfully!
        </div>
      )}
      
      {formState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formState.errorMessage || "An error occurred. Please try again."}
        </div>
      )}
      
      {/* Campo oculto para o ID (necessário para atualização) */}
      {type === "update" && <input type="hidden" {...register("id")} />}

      {/* Nome do envio */}
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-gray-700 text-sm font-medium">
          Shipping Name
        </label>
        <input
          id="name"
          type="text"
          className="border border-gray-300 p-2 rounded-md"
          placeholder="Enter shipping name"
          {...register("name")}
        />
        {errors?.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      {/* Status do envio */}
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-gray-700 text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          className="border border-gray-300 p-2 rounded-md"
          {...register("status")}
        >
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {errors?.status && (
          <span className="text-red-500 text-sm">{errors.status.message}</span>
        )}
      </div>

      {/* Transportadora */}
      <div className="flex flex-col gap-1">
        <label htmlFor="carrier" className="text-gray-700 text-sm font-medium">
          Carrier
        </label>
        <input
          id="carrier"
          type="text"
          className="border border-gray-300 p-2 rounded-md"
          placeholder="Enter carrier name"
          {...register("carrier")}
        />
        {errors?.carrier && (
          <span className="text-red-500 text-sm">{errors.carrier.message}</span>
        )}
      </div>

      {/* Data estimada de entrega */}
      <div className="flex flex-col gap-1">
        <label htmlFor="estimatedDelivery" className="text-gray-700 text-sm font-medium">
          Estimated Delivery Date
        </label>
        <input
          id="estimatedDelivery"
          type="date"
          className="border border-gray-300 p-2 rounded-md"
          defaultValue={getDefaultEstimatedDate()}
          {...register("estimatedDelivery", { 
            setValueAs: (value) => {
              if (!value) {
                return new Date(new Date().setDate(new Date().getDate() + 7));
              }
              return new Date(value);
            }
          })}
        />
        {errors?.estimatedDelivery && (
          <span className="text-red-500 text-sm">{errors.estimatedDelivery.message}</span>
        )}
      </div>

      {/* Produto */}
      <div className="flex flex-col gap-1">
        <label htmlFor="productId" className="text-gray-700 text-sm font-medium">
          Product
        </label>
        <select
          id="productId"
          className="border border-gray-300 p-2 rounded-md"
          {...register("productId", { valueAsNumber: true })}
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} {product.price ? `($${product.price})` : ''}
            </option>
          ))}
        </select>
        {errors?.productId && (
          <span className="text-red-500 text-sm">{errors.productId.message}</span>
        )}
      </div>

      {/* Estoque - Filtrado pelo produto selecionado */}
      <div className="flex flex-col gap-1">
        <label htmlFor="stockId" className="text-gray-700 text-sm font-medium">
          Stock
        </label>
        <select
          id="stockId"
          className="border border-gray-300 p-2 rounded-md"
          disabled={!selectedProductId || filteredStocks.length === 0}
          {...register("stockId", { valueAsNumber: true })}
        >
          <option value="">Select a stock</option>
          {filteredStocks.map((stock) => (
            <option key={stock.id} value={stock.id}>
              Stock #{stock.id} - Level: {stock.stockLevel}
            </option>
          ))}
        </select>
        {errors?.stockId && (
          <span className="text-red-500 text-sm">{errors.stockId.message}</span>
        )}
        {selectedProductId && filteredStocks.length === 0 && (
          <span className="text-yellow-500 text-sm">No stock records available for the selected product</span>
        )}
      </div>

      {/* Data e usuário de criação/atualização */}
      <div className="text-xs text-gray-500 mt-1">
        {type === "create" ? "Will be created" : "Last updated"}: {currentDate} by {currentUser}
      </div>
      
      <button 
        className={`${isSubmitting ? 'bg-gray-400' : type === 'create' ? 'bg-blue-500' : 'bg-green-500'} text-white p-2 rounded-md`}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 
          (type === "create" ? "Creating..." : "Updating...") : 
          (type === "create" ? "Create Shipping" : "Update Shipping")
        }
      </button>
    </form>
  );
};

export default ShippingForm;