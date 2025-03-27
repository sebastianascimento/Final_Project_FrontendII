"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { shippingSchema } from "@/app/lib/formValidationSchemas";
import { z } from "zod";
import { createShipping, updateShipping } from "@/app/lib/actions";

type ShippingInputs = z.infer<typeof shippingSchema>;
type ShippingStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface StatusOption {
  value: ShippingStatus;
  label: string;
}

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
  const currentDate = "2025-03-27 12:39:14";
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

  const [productInput, setProductInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const prevProductInputRef = useRef<string>("");

  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions: StatusOption[] = [
    { value: "PENDING", label: "Pending" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const apiUrls = useMemo(() => {
    if (!companyId) return null;
    return {
      products: `/api/products?companyId=${companyId}`,
      stocks: `/api/stocks?companyId=${companyId}`,
    };
  }, [companyId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!apiUrls) return;

      setIsLoading(true);
      
      try {
        const [productsRes, stocksRes] = await Promise.all([
          fetch(apiUrls.products),
          fetch(apiUrls.stocks),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          
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

        if (stocksRes.ok) {
          const stocksData = await stocksRes.json();
          
          if (Array.isArray(stocksData)) {
            setStocks(stocksData);
          } else if (stocksData && typeof stocksData === "object") {
            const possibleArrays = ["data", "stocks", "items", "results"];
            for (const key of possibleArrays) {
              if (Array.isArray(stocksData[key])) {
                setStocks(stocksData[key]);
                break;
              }
            }
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    if (apiUrls) {
      fetchData();
    }
  }, [apiUrls]);

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
      productId: 0,
      stockId: 0,
      name: "",
    },
  });

  const selectedProductId = watch("productId");
  const statusValue = watch("status") || "PENDING";

  const handleStatusChange = (status: ShippingStatus) => {
    setValue("status", status, { shouldValidate: true });
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setProductInput(input);

    if (!input) {
      setSelectedProduct(null);
      setValue("productId", 0);
      prevProductInputRef.current = "";
      return;
    }

    const normalizedInput = input.toLowerCase().trim();
    const exactMatch = products.find(
      (p) => p.name.toLowerCase().trim() === normalizedInput
    );

    if (
      selectedProduct &&
      selectedProduct.name.toLowerCase().trim() !== normalizedInput
    ) {
      if (!exactMatch) {
        if (
          isEditingProduct ||
          !products.some((p) => p.name.toLowerCase().includes(normalizedInput))
        ) {
          setSelectedProduct(null);
          setValue("productId", 0);
        }
      }
    }

    const isDeletion = input.length < prevProductInputRef.current.length;
    prevProductInputRef.current = input;

    if (exactMatch) {
      setSelectedProduct(exactMatch);
      setValue("productId", exactMatch.id);
      return;
    }

    if (!isDeletion && !isEditingProduct) {
      const partialMatch = products.find((p) =>
        p.name.toLowerCase().trim().includes(normalizedInput)
      );

      if (partialMatch) {
        setSelectedProduct(partialMatch);
        setValue("productId", partialMatch.id);
        setProductInput(partialMatch.name);
        prevProductInputRef.current = partialMatch.name;
      } else {
        setSelectedProduct(null);
        setValue("productId", 0);
      }
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      const filtered = stocks.filter(
        (stock) => stock.productId === Number(selectedProductId)
      );
      setFilteredStocks(filtered);
      setSelectedStockId(null);
      setValue("stockId", 0);

      if (filtered.length === 1) {
        setSelectedStockId(filtered[0].id);
        setValue("stockId", filtered[0].id);
      }
    } else {
      setFilteredStocks([]);
      setSelectedStockId(null);
      setValue("stockId", 0);
    }
  }, [selectedProductId, stocks, setValue]);

  useEffect(() => {
    if (type === "update" && data && !isLoading && products.length > 0) {
      try {
        const estimatedDate = data.estimatedDelivery
          ? new Date(data.estimatedDelivery)
          : new Date(new Date().setDate(new Date().getDate() + 7));
          
        reset({
          id: data.id,
          status: data.status || "PENDING",
          carrier: data.carrier || "",
          estimatedDelivery: estimatedDate,
          productId: data.productId ? Number(data.productId) : 0,
          stockId: data.stockId ? Number(data.stockId) : 0,
          name: data.name || `Shipping #${data.id}`
        });
  
        if (data.productId) {
          const product = products.find((p) => p.id === Number(data.productId));
          if (product) {
            setProductInput(product.name);
            setSelectedProduct(product);
            prevProductInputRef.current = product.name;
          }
        }
  
        if (data.stockId) {
          setSelectedStockId(Number(data.stockId));
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }, [data, reset, type, products, isLoading]);

  useEffect(() => {
    if (selectedProduct) {
      setValue("name", `Shipping for ${selectedProduct.name} - ${new Date().toLocaleDateString()}`);
    } else {
      setValue("name", "");
    }
  }, [selectedProduct, setValue]);

  useEffect(() => {
    if (selectedStockId !== null) {
      setValue("stockId", selectedStockId);
    } else {
      setValue("stockId", 0);
    }
  }, [selectedStockId, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });

    try {
      const shippingName = `Shipping for ${selectedProduct?.name || "Unknown"} - ${new Date().toLocaleDateString()}`;
      
      const stockData = {
        ...formData,
        name: shippingName,
        stockId: Number(selectedStockId),
        productId: Number(formData.productId),
        companyId: String(companyId),
      };

      let result;
      if (type === "create") {
        result = await createShipping({ success: false, error: false }, stockData);
      } else {
        if (!stockData.id) {
          setFormState({
            success: false,
            error: true,
            errorMessage: "Shipping ID is missing",
          });
          return;
        }

        result = await updateShipping({ success: false, error: false }, stockData);
      }

      if (result?.error) {
        setFormState({
          success: false,
          error: true,
          errorMessage: result.message || "Failed to save shipping information.",
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

  if (!companyId) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-4">
          Company ID not available. Please ensure you're logged in and
          associated with a company.
        </div>
        <button
          onClick={() => (window.location.href = "/signin")}
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

  const getStockDropdownText = () => {
    if (!selectedProductId) {
      return "Select a product first";
    }

    if (filteredStocks.length === 0) {
      return "No stocks available";
    }

    if (selectedStockId) {
      const stock = filteredStocks.find((s) => s.id === selectedStockId);
      if (stock) {
        return `Stock #${stock.id} - Available: ${stock.stockLevel} units`;
      }
    }

    return "Select a stock";
  };

  const isButtonDisabled = isSubmitting || !selectedProduct || !selectedStockId || !watch("carrier");

  // Button color classes based on type
  const buttonColorClass = isButtonDisabled
    ? "bg-gray-400 cursor-not-allowed"
    : type === "create"
    ? "bg-blue-500 hover:bg-blue-600"
    : "bg-green-500 hover:bg-green-600";

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      {formState.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Shipping record {type === "create" ? "created" : "updated"} successfully!
        </div>
      )}

      {formState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formState.errorMessage || "An error occurred. Please try again."}
        </div>
      )}

      {type === "update" && <input type="hidden" {...register("id")} />}
      <input type="hidden" {...register("productId")} />
      <input type="hidden" {...register("stockId")} />
      <input type="hidden" {...register("name")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 mb-1">Status</label>
          <input type="hidden" {...register("status")} />

          <div className="grid grid-cols-2 gap-2">
            {statusOptions.slice(0, 4).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                className={`px-2 py-1.5 text-xs sm:text-sm rounded-md border transition-colors ${
                  statusValue === option.value
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                disabled={isLoading || isSubmitting}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => handleStatusChange("CANCELLED")}
              className={`px-2 py-1.5 text-xs sm:text-sm rounded-md border transition-colors ${
                statusValue === "CANCELLED"
                  ? "bg-red-500 text-white border-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              disabled={isLoading || isSubmitting}
            >
              Cancelled
            </button>
          </div>

          {errors?.status && (
            <span className="text-red-500 text-sm">
              {errors.status.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="carrier"
            className="text-gray-700 mb-1"
          >
            Carrier
          </label>
          <input
            id="carrier"
            type="text"
            className={`border ${errors.carrier ? "border-red-500" : "border-gray-300"} p-2 rounded-md`}
            placeholder="Enter carrier name (min 2 characters)"
            {...register("carrier")}
            disabled={isSubmitting}
          />
          {errors?.carrier && (
            <span className="text-red-500 text-sm">
              {errors.carrier.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="estimatedDelivery"
            className="text-gray-700 mb-1"
          >
            Estimated Delivery Date
          </label>
          <input
            id="estimatedDelivery"
            type="date"
            className={`border ${errors.estimatedDelivery ? "border-red-500" : "border-gray-300"} p-2 rounded-md`}
            defaultValue={getDefaultEstimatedDate()}
            {...register("estimatedDelivery", {
              setValueAs: (value) => {
                if (!value) {
                  return new Date(new Date().setDate(new Date().getDate() + 7));
                }
                return new Date(value);
              },
            })}
            disabled={isSubmitting}
          />
          {errors?.estimatedDelivery && (
            <span className="text-red-500 text-sm">
              {errors.estimatedDelivery.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="product-input"
            className="text-gray-700 mb-1"
          >
            Product
          </label>
          <div className="relative">
            <input
              id="product-input"
              type="text"
              value={productInput}
              onChange={handleProductInputChange}
              onFocus={() => setIsEditingProduct(true)}
              onBlur={() => {
                setIsEditingProduct(false);
                const exactMatch = products.find(
                  (p) =>
                    p.name.toLowerCase().trim() ===
                    productInput.toLowerCase().trim()
                );
                if (!exactMatch) {
                  setSelectedProduct(null);
                  setValue("productId", 0);
                }
              }}
              className={`w-full border ${
                errors.productId
                  ? "border-red-500"
                  : selectedProduct
                  ? "border-green-500"
                  : "border-gray-300"
              } p-2 rounded-md`}
              placeholder="Enter or select a product"
              list="product-options"
              disabled={isLoading || isSubmitting}
            />
            <datalist id="product-options">
              {Array.isArray(products) && products.length > 0
                ? products.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.price ? `$${product.price}` : ""}
                    </option>
                  ))
                : null}
            </datalist>
          </div>

          {errors?.productId && (
            <span className="text-red-500 text-sm">
              {errors.productId.message}
            </span>
          )}

          {productInput && !selectedProduct && !isLoading && (
            <span className="text-yellow-500 text-xs">
              Product not found. Check the name or add a new product.
            </span>
          )}

          {selectedProduct && (
            <span className="text-green-600 text-xs">
              Product found: {selectedProduct.name}
              {selectedProduct.price ? ` ($${selectedProduct.price})` : ""}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label
            htmlFor="custom-stock-dropdown"
            className="text-gray-700 mb-1"
          >
            Stock
          </label>

          <div className="relative" ref={dropdownRef}>
            <div
              id="custom-stock-dropdown"
              onClick={() => {
                if (selectedProductId && filteredStocks.length > 0 && !isSubmitting) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`border ${
                errors.stockId ? "border-red-500" :
                !selectedProductId || filteredStocks.length === 0 || isSubmitting
                  ? "bg-gray-100 text-gray-500"
                  : "bg-white cursor-pointer hover:bg-gray-50"
              } border-gray-300 p-2 rounded-md flex justify-between items-center`}
            >
              <span>{getStockDropdownText()}</span>
              {selectedProductId && filteredStocks.length > 0 && !isSubmitting && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {isDropdownOpen && filteredStocks.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg rounded-md max-h-56 overflow-auto">
                <ul>
                  <li
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setSelectedStockId(null);
                      setValue("stockId", 0);
                      setIsDropdownOpen(false);
                    }}
                  >
                    Select a stock
                  </li>

                  {filteredStocks.map((stock) => (
                    <li
                      key={stock.id}
                      className={`px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                        selectedStockId === stock.id ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        setSelectedStockId(stock.id);
                        setValue("stockId", stock.id);
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

          {errors?.stockId && (
            <span className="text-red-500 text-sm">
              {errors.stockId.message}
            </span>
          )}

          {selectedProductId && filteredStocks.length === 0 && (
            <span className="text-yellow-500 text-sm">
              No stock records available for the selected product
            </span>
          )}
          
          {!selectedStockId && selectedProductId && filteredStocks.length > 0 && (
            <span className="text-yellow-500 text-sm">
              Please select a stock
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {type === "update" && data?.updatedAt && `Last updated: ${currentDate} by ${currentUser}`}
      </div>

      <button
        type="submit"
        className={`${buttonColorClass} text-white p-2 rounded-md transition-colors`}
        disabled={isButtonDisabled}
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