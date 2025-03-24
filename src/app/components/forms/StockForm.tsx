"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { stockSchema } from "@/app/lib/formValidationSchemas";
import { createStock, updateStock } from "@/app/lib/actions";

type StockInputs = z.infer<typeof stockSchema>;

interface Product {
  id: number;
  name: string;
  price?: number;
}

interface Supplier {
  id: number;
  name: string;
  contact?: string;
}

interface StockFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const StockForm = ({ type, data, setOpen }: StockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    success: false,
    error: false,
    errorMessage: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [useExistingSupplier, setUseExistingSupplier] = useState(true);
  const currentDate = "2025-03-24 11:12:13";
  const currentUser = "sebastianascimento";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const productsResponse = await fetch("/api/products");
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          
          if (Array.isArray(productsData)) {
            setProducts(productsData);
          } else if (productsData && typeof productsData === "object") {
            const possibleArrays = ["data", "products", "items", "results"];
            for (const key of possibleArrays) {
              if (Array.isArray(productsData[key])) {
                setProducts(productsData[key]);
                break;
              }
            }
          }
        }

        const suppliersResponse = await fetch("/api/suppliers");
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();

          if (Array.isArray(suppliersData)) {
            setSuppliers(suppliersData);
          } else if (suppliersData && typeof suppliersData === "object") {
            const possibleArrays = ["data", "suppliers", "items", "results"];
            for (const key of possibleArrays) {
              if (Array.isArray(suppliersData[key])) {
                setSuppliers(suppliersData[key]);
                break;
              }
            }
          } else {
            setSuppliers([]);
          }

          if (!Array.isArray(suppliersData) || suppliersData.length === 0) {
            setUseExistingSupplier(false);
          }
        } else {
          setSuppliers([]);
          setUseExistingSupplier(false);
        }
      } catch (error) {
        setSuppliers([]);
        setUseExistingSupplier(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StockInputs>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      productId: 0,
      stockLevel: 0,
      supplierId: 0,
    },
  });

  const selectedProductId = watch("productId");

  useEffect(() => {
    if (type === "update" && data) {
      reset({
        id: data.id,
        productId: data.productId || 0,
        stockLevel: data.stockLevel || 0,
        supplierId: data.supplierId || 0,
      });

      setUseExistingSupplier(true);
    }
  }, [data, reset, type]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });

    try {
      const timestamp = "2025-03-24 11:12:13";
      const username = "sebastianascimento";
      
      const stockData: any = { ...formData };

      if (!useExistingSupplier && newSupplierName.trim()) {
        stockData.newSupplierName = newSupplierName.trim();
        stockData.supplierId = 0;
      }

      let result;
      if (type === "create") {
        result = await createStock({ success: false, error: false }, stockData);
      } else {
        if (!stockData.id) {
          setFormState({
            success: false,
            error: true,
            errorMessage: "Stock ID is missing",
          });
          return;
        }

        result = await updateStock({ success: false, error: false }, stockData);
      }

      if (result?.error) {
        setFormState({
          success: false,
          error: true,
          errorMessage: result.message || "Failed to save stock information.",
        });
        return;
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
          error instanceof Error
            ? error.message
            : "An error occurred during submission",
      });
    } finally {
      setIsSubmitting(false);
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      {formState.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Stock record {type === "create" ? "created" : "updated"} successfully!
        </div>
      )}

      {formState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formState.errorMessage || "An error occurred. Please try again."}
        </div>
      )}

      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="productId" className="text-gray-700 mb-1">
            Product
          </label>
          
          <select
            id="productId"
            className="border border-gray-300 p-2 rounded-md w-full"
            {...register("productId", { valueAsNumber: true })}
            disabled={!Array.isArray(products) || products.length === 0}
          >
            <option value="">Select a product</option>
            {Array.isArray(products) ? (
              products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.price ? `($${product.price})` : ""}
                </option>
              ))
            ) : (
              <option value="">Loading products...</option>
            )}
          </select>
          {errors?.productId && (
            <span className="text-red-500 text-sm">
              {errors.productId.message as string}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="supplierId" className="text-gray-700">
            Supplier
          </label>

          {Array.isArray(suppliers) &&
            suppliers.length > 0 &&
            type === "create" && (
              <div className="flex items-center mb-2 space-x-4 text-sm">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={useExistingSupplier}
                    onChange={() => setUseExistingSupplier(true)}
                  />
                  <span className="ml-2">Existing supplier</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={!useExistingSupplier}
                    onChange={() => setUseExistingSupplier(false)}
                  />
                  <span className="ml-2">New supplier</span>
                </label>
              </div>
            )}

          {useExistingSupplier ? (
            <select
              id="supplierId"
              className="border border-gray-300 p-2 rounded-md"
              {...register("supplierId", { valueAsNumber: true })}
              disabled={!Array.isArray(suppliers) || suppliers.length === 0}
            >
              <option value="">Select a supplier</option>
              {Array.isArray(suppliers) ? (
                suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}{" "}
                    {supplier.contact ? `(${supplier.contact})` : ""}
                  </option>
                ))
              ) : (
                <option value="">Loading suppliers...</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-md"
              placeholder="Enter new supplier name"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
            />
          )}

          {useExistingSupplier && errors?.supplierId && (
            <span className="text-red-500 text-sm">
              {errors.supplierId.message as string}
            </span>
          )}

          {!useExistingSupplier && !newSupplierName.trim() && (
            <span className="text-red-500 text-sm">
              Supplier name is required
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="stockLevel" className="text-gray-700">
            Stock Level (Quantity)
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                const currentValue = Number(watch("stockLevel")) || 0;
                if (currentValue > 0) {
                  setValue("stockLevel", currentValue - 1);
                }
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-l-md"
            >
              -
            </button>
            <input
              id="stockLevel"
              type="number"
              min="0"
              className="border-y border-gray-300 p-2 text-center w-full"
              {...register("stockLevel", { valueAsNumber: true })}
            />
            <button
              type="button"
              onClick={() => {
                const currentValue = Number(watch("stockLevel")) || 0;
                setValue("stockLevel", currentValue + 1);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-r-md"
            >
              +
            </button>
          </div>
          {errors?.stockLevel && (
            <span className="text-red-500 text-sm">
              {errors.stockLevel.message as string}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {type === "update" && `Last updated: ${currentDate} by ${currentUser}`}
      </div>

      <button
        className={`${
          isSubmitting
            ? "bg-gray-400"
            : type === "create"
            ? "bg-blue-400"
            : "bg-green-500"
        } text-white p-2 rounded-md`}
        disabled={
          isSubmitting || (!useExistingSupplier && !newSupplierName.trim())
        }
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

export default StockForm;