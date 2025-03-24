"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;
  const currentDateTime = "2025-03-24 14:03:19";
  const currentUser = "sebastianascimento";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    success: false,
    error: false,
    errorMessage: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  
  // Custom dropdown states
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) {
        return;
      }
      
      setIsLoading(true);
      try {
        const productsRes = await fetch(`/api/products?companyId=${companyId}`);
        
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          
          const productsArray = Array.isArray(productsData) 
            ? productsData 
            : productsData?.data || productsData?.products || [];
          
          setProducts(productsArray);
        } else {
          setProducts([]);
        }

        const stocksRes = await fetch(`/api/stocks?companyId=${companyId}`);
        if (stocksRes.ok) {
          const stocksData = await stocksRes.json();
          const stocksArray = Array.isArray(stocksData) 
            ? stocksData 
            : stocksData?.data || stocksData?.stocks || [];
            
          setStocks(stocksArray);
        } else {
          setStocks([]);
        }
      } catch (error) {
        setProducts([]);
        setStocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

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
      status: "PENDING",
      carrier: "",
      estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  const selectedProductId = watch("productId");

  useEffect(() => {
    if (selectedProductId) {
      const filtered = stocks.filter(
        (stock) => stock.productId === Number(selectedProductId)
      );
      setFilteredStocks(filtered);
      setSelectedStockId(null); // Reset selection

      if (filtered.length === 1) {
        // Auto-select if only one stock exists
        setSelectedStockId(filtered[0].id);
      }
    } else {
      setFilteredStocks([]);
      setSelectedStockId(null);
    }
  }, [selectedProductId, stocks]);

  useEffect(() => {
    if (type === "update" && data) {
      const estimatedDate = data.estimatedDelivery
        ? new Date(data.estimatedDelivery)
        : new Date(new Date().setDate(new Date().getDate() + 7));

      reset({
        id: data.id,
        status: data.status || "PENDING",
        carrier: data.carrier || "",
        estimatedDelivery: estimatedDate,
        productId: data.productId || "",  // Changed from 0 to empty string
      });
      
      // Set our custom state for the selected stock
      if (data.stockId) {
        setSelectedStockId(data.stockId);
      }
    }
  }, [data, reset, type]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!companyId) {
      setFormState({
        success: false,
        error: true,
        errorMessage: "No company ID available. Please log in again.",
      });
      return;
    }
    
    // Use selectedStockId from our custom state
    const stockIdValue = selectedStockId || 0;
    
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });

    try {
      const submissionData = {
        ...formData,
        stockId: stockIdValue,
        productId: Number(formData.productId), // Ensure productId is a number
        companyId,
      };
      
      if (type === "create") {
        await createShipping({ success: false, error: false }, submissionData);
      } else if (type === "update") {
        if (!formData.id) {
          throw new Error("Missing shipping ID for update");
        }
        await updateShipping({ success: false, error: false }, submissionData);
      }

      setFormState({ success: true, error: false, errorMessage: "" });

      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      setFormState({
        success: false,
        error: true,
        errorMessage:
          error instanceof Error ? error.message : "Unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!companyId) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-4">
          Company ID not available. Please ensure you're logged in and associated with a company.
        </div>
        <button
          onClick={() => window.location.href = '/signin'}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getDefaultEstimatedDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return formatDateForInput(date);
  };

  // Get the text for the stock dropdown
  const getStockDropdownText = () => {
    // If no product is selected, prompt to select a product first
    if (!selectedProductId) {
      return "Select a product first";
    }
    
    // If no stocks available for the selected product
    if (filteredStocks.length === 0) {
      return "No stocks available";
    }
    
    // If a specific stock is selected, show its details
    if (selectedStockId) {
      const stock = filteredStocks.find(s => s.id === selectedStockId);
      if (stock) {
        return `Stock #${stock.id} - Available: ${stock.stockLevel} units`;
      }
    }
    
    // Default state - prompt to select a stock
    return "Select a stock";
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
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

      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex flex-col gap-1">
          <label
            htmlFor="estimatedDelivery"
            className="text-gray-700 text-sm font-medium"
          >
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
              },
            })}
          />
          {errors?.estimatedDelivery && (
            <span className="text-red-500 text-sm">
              {errors.estimatedDelivery.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="productId"
            className="text-gray-700 text-sm font-medium"
          >
            Product
          </label>
          <select
            id="productId"
            {...register("productId")}
            className={`w-full border ${
              errors.productId ? "border-red-500" : "border-gray-300"
            } p-2 rounded-md`}
            disabled={isLoading}
          >
            <option value="">Select a product</option>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.price ? `($${product.price})` : ""}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {isLoading ? "Loading products..." : "No products available"}
              </option>
            )}
          </select>
          {errors?.productId && (
            <span className="text-red-500 text-sm">
              {errors.productId.message}
            </span>
          )}
          {Array.isArray(products) && products.length === 0 && !isLoading && (
            <div className="text-yellow-500 text-xs mt-1">
              No products found for your company. Create products first.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label htmlFor="custom-stock-dropdown" className="text-gray-700 text-sm font-medium">
            Stock
          </label>
          
          {/* Completely custom dropdown instead of select */}
          <div className="relative" ref={dropdownRef}>
            <div 
              id="custom-stock-dropdown"
              onClick={() => {
                if (selectedProductId && filteredStocks.length > 0) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`border ${
                !selectedProductId || filteredStocks.length === 0 
                  ? "bg-gray-100 text-gray-500"
                  : "bg-white cursor-pointer hover:bg-gray-50"
              } border-gray-300 p-2 rounded-md flex justify-between items-center`}
            >
              <span>{getStockDropdownText()}</span>
              {selectedProductId && filteredStocks.length > 0 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            {/* Custom dropdown options */}
            {isDropdownOpen && filteredStocks.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg rounded-md max-h-56 overflow-auto">
                <ul>
                  <li 
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setSelectedStockId(null);
                      setIsDropdownOpen(false);
                    }}
                  >
                    Select a stock
                  </li>
                  
                  {filteredStocks.map(stock => (
                    <li
                      key={stock.id}
                      className={`px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                        selectedStockId === stock.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => {
                        setSelectedStockId(stock.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      Stock #{stock.id} - Available: {stock.stockLevel} units
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {selectedProductId && filteredStocks.length === 0 && (
            <span className="text-yellow-500 text-sm">
              No stock records available for the selected product
            </span>
          )}
        </div>
      </div>

      {/* Add timestamp for update forms */}
      {type === "update" && (
        <div className="text-xs text-gray-500 text-right mt-2">
          Last updated: {currentDateTime} by {currentUser}
        </div>
      )}

      <button
        className={`${
          isSubmitting
            ? "bg-gray-400"
            : type === "create"
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white p-2 rounded-md transition-colors`}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default ShippingForm;