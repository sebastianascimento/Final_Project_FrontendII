"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useRef, useMemo } from "react";
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
  const currentDate = "2025-03-25 19:21:30";
  const currentUser = "sebastianascimento";
  
  // Product selection state
  const [productInput, setProductInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const prevProductInputRef = useRef<string>("");
  
  // Supplier selection state
  const [supplierInput, setSupplierInput] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const prevSupplierInputRef = useRef<string>("");

  // Optimize API URLs
  const apiUrls = useMemo(() => ({
    products: "/api/products",
    suppliers: "/api/suppliers",
  }), []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Fetch data in parallel
        const [productsResponse, suppliersResponse] = await Promise.all([
          fetch(apiUrls.products),
          fetch(apiUrls.suppliers)
        ]);
        
        // Handle products response
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
        
        // Handle suppliers response
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
  }, [apiUrls]);

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
  const selectedSupplierId = watch("supplierId");

  // Improved product input change handler
  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setProductInput(input);
    
    if (!input) {
      setSelectedProduct(null);
      setValue("productId", 0);
      prevProductInputRef.current = "";
      return;
    }
    
    // Always check for exact match regardless of deletion or typing
    const normalizedInput = input.toLowerCase().trim();
    const exactMatch = products.find(
      p => p.name.toLowerCase().trim() === normalizedInput
    );
    
    // Always check if we no longer match the currently selected product
    if (selectedProduct && selectedProduct.name.toLowerCase().trim() !== normalizedInput) {
      // If we don't have an exact match with the new input
      if (!exactMatch) {
        // Clear selection if user is actively editing or if no partial matches
        if (isEditingProduct || !products.some(p => p.name.toLowerCase().includes(normalizedInput))) {
          setSelectedProduct(null);
          setValue("productId", 0);
        }
      }
    }
    
    // Check if user is deleting characters
    const isDeletion = input.length < prevProductInputRef.current.length;
    prevProductInputRef.current = input;
    
    // If we have an exact match, always set it
    if (exactMatch) {
      setSelectedProduct(exactMatch);
      setValue("productId", exactMatch.id);
      return;
    }

    // For partial matches, only autocomplete when adding characters (not deleting)
    if (!isDeletion && !isEditingProduct) {
      const partialMatch = products.find(
        p => p.name.toLowerCase().trim().includes(normalizedInput)
      );
      
      if (partialMatch) {
        setSelectedProduct(partialMatch);
        setValue("productId", partialMatch.id);
        
        // Autocomplete the input field
        setProductInput(partialMatch.name);
        prevProductInputRef.current = partialMatch.name;
      } else {
        setSelectedProduct(null);
        setValue("productId", 0);
      }
    }
  };
  
  // Handle supplier input change - similarly improved
  const handleSupplierInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSupplierInput(input);
    
    if (!input) {
      setSelectedSupplier(null);
      setValue("supplierId", 0);
      prevSupplierInputRef.current = "";
      return;
    }
    
    // Always check for exact match
    const normalizedInput = input.toLowerCase().trim();
    const exactMatch = suppliers.find(
      s => s.name.toLowerCase().trim() === normalizedInput
    );
    
    // Always check if we no longer match the currently selected supplier
    if (selectedSupplier && selectedSupplier.name.toLowerCase().trim() !== normalizedInput) {
      if (!exactMatch) {
        if (isEditingSupplier || !suppliers.some(s => s.name.toLowerCase().includes(normalizedInput))) {
          setSelectedSupplier(null);
          setValue("supplierId", 0);
        }
      }
    }
    
    // Check if user is deleting characters
    const isDeletion = input.length < prevSupplierInputRef.current.length;
    prevSupplierInputRef.current = input;
    
    // If we have an exact match, always set it
    if (exactMatch) {
      setSelectedSupplier(exactMatch);
      setValue("supplierId", exactMatch.id);
      return;
    }
    
    // For partial matches, only autocomplete when adding characters (not deleting)
    if (!isDeletion && !isEditingSupplier) {
      const partialMatch = suppliers.find(
        s => s.name.toLowerCase().trim().includes(normalizedInput)
      );
      
      if (partialMatch) {
        setSelectedSupplier(partialMatch);
        setValue("supplierId", partialMatch.id);
        
        setSupplierInput(partialMatch.name);
        prevSupplierInputRef.current = partialMatch.name;
      } else {
        setSelectedSupplier(null);
        setValue("supplierId", 0);
      }
    }
  };

  useEffect(() => {
    if (type === "update" && data && !isLoading) {
      reset({
        id: data.id,
        productId: data.productId || 0,
        stockLevel: data.stockLevel || 0,
        supplierId: data.supplierId || 0,
      });

      setUseExistingSupplier(true);
      
      // Find and set the product for the display
      if (data.productId && products.length > 0) {
        const product = products.find(p => p.id === data.productId);
        if (product) {
          setProductInput(product.name);
          setSelectedProduct(product);
          prevProductInputRef.current = product.name;
        }
      }
      
      // Find and set the supplier for the display
      if (data.supplierId && suppliers.length > 0) {
        const supplier = suppliers.find(s => s.id === data.supplierId);
        if (supplier) {
          setSupplierInput(supplier.name);
          setSelectedSupplier(supplier);
          prevSupplierInputRef.current = supplier.name;
        }
      }
    }
  }, [data, reset, type, products, suppliers, isLoading]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });

    try {
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
          
          {/* Replace select with input + datalist for better typing experience */}
          <div>
            <input
              id="productInput"
              type="text"
              className={`border ${
                errors?.productId ? "border-red-500" : selectedProduct ? "border-green-500" : "border-gray-300"
              } p-2 rounded-md w-full`}
              placeholder="Enter or select a product"
              list="product-options"
              value={productInput}
              onChange={handleProductInputChange}
              onFocus={() => setIsEditingProduct(true)}
              onBlur={() => {
                setIsEditingProduct(false);
                // Validate match on blur
                const exactMatch = products.find(
                  p => p.name.toLowerCase().trim() === productInput.toLowerCase().trim()
                );
                if (!exactMatch) {
                  setSelectedProduct(null);
                  setValue("productId", 0);
                }
              }}
              disabled={!Array.isArray(products) || products.length === 0}
            />
            <datalist id="product-options">
              {Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.price ? `$${product.price}` : ""}
                  </option>
                ))
              ) : null}
            </datalist>
            <input type="hidden" {...register("productId", { valueAsNumber: true })} />
          </div>
          
          {errors?.productId && (
            <span className="text-red-500 text-sm">
              {errors.productId.message as string}
            </span>
          )}
          
          {/* Feedback for product selection */}
          {productInput && !selectedProduct && !isLoading && (
            <span className="text-yellow-500 text-xs">
              Product not found. Check the name or add a new product.
            </span>
          )}
          
          {selectedProduct && (
            <span className="text-green-600 text-xs">
              Product found: {selectedProduct.name} 
              {selectedProduct.price ? ` ($${selectedProduct.price})` : ''}
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
            <div>
              <input
                id="supplierInput"
                type="text"
                className={`border ${
                  errors?.supplierId ? "border-red-500" : selectedSupplier ? "border-green-500" : "border-gray-300"
                } p-2 rounded-md w-full`}
                placeholder="Enter or select a supplier"
                list="supplier-options"
                value={supplierInput}
                onChange={handleSupplierInputChange}
                onFocus={() => setIsEditingSupplier(true)}
                onBlur={() => {
                  setIsEditingSupplier(false);
                  // Validate match on blur
                  const exactMatch = suppliers.find(
                    s => s.name.toLowerCase().trim() === supplierInput.toLowerCase().trim()
                  );
                  if (!exactMatch) {
                    setSelectedSupplier(null);
                    setValue("supplierId", 0);
                  }
                }}
                disabled={!Array.isArray(suppliers) || suppliers.length === 0}
              />
              <datalist id="supplier-options">
                {Array.isArray(suppliers) && suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.contact ? `(${supplier.contact})` : ""}
                    </option>
                  ))
                ) : null}
              </datalist>
              <input type="hidden" {...register("supplierId", { valueAsNumber: true })} />
              
              {errors?.supplierId && (
                <span className="text-red-500 text-sm">
                  {errors.supplierId.message as string}
                </span>
              )}
              
              {/* Feedback for supplier selection */}
              {supplierInput && !selectedSupplier && !isLoading && (
                <span className="text-yellow-500 text-xs">
                  Supplier not found. Check the name or add a new supplier.
                </span>
              )}
              
              {selectedSupplier && (
                <span className="text-green-600 text-xs">
                  Supplier found: {selectedSupplier.name}
                  {selectedSupplier.contact ? ` (${selectedSupplier.contact})` : ''}
                </span>
              )}
            </div>
          ) : (
            <input
              type="text"
              className="border border-gray-300 p-2 rounded-md"
              placeholder="Enter new supplier name"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
            />
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
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white p-2 rounded-md transition-colors`}
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