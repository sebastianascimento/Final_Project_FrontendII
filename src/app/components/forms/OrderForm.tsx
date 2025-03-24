"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import InputField from "../InputField";
import { orderSchema } from "@/app/lib/formValidationSchemas";
import { createOrder, updateOrder } from "@/app/lib/actions";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";

type OrderInputs = z.infer<typeof orderSchema>;

interface Product {
  id: number;
  name: string;
  price?: number;
  companyId: string;
}

interface Customer {
  id: number;
  name: string;
  companyId: string;
}

interface FormState {
  success: boolean;
  error: boolean;
  errorMessage: string;
}

const OrderForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;
  const currentDate = "2025-03-24 14:21:04";
  const currentUser = "sebastianascimento";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    success: false,
    error: false,
    errorMessage: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<{
    products: Product[];
    customers: Customer[];
    isLoaded: boolean;
  }>({
    products: [],
    customers: [],
    isLoaded: false,
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<OrderInputs>({
    resolver: zodResolver(orderSchema),
  });

  const quantity = watch("quantity");
  const productName = watch("product");
  const customerName = watch("customer");

  const totalAmount = useMemo(() => {
    if (selectedProduct?.price && quantity) {
      return selectedProduct.price * Number(quantity);
    }
    return 0;
  }, [selectedProduct, quantity]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        return;
      }

      setIsLoading(true);

      try {
        const [productsResponse, customersResponse] = await Promise.all([
          fetch(`/api/products?companyId=${companyId}`),
          fetch(`/api/customers?companyId=${companyId}`),
        ]);

        if (!productsResponse.ok || !customersResponse.ok) {
          throw new Error("Failed to fetch company data");
        }

        const productsData = await productsResponse.json();
        const customersData = await customersResponse.json();

        const productsArray = Array.isArray(productsData) 
          ? productsData 
          : productsData?.data || productsData?.products || [];
          
        const customersArray = Array.isArray(customersData) 
          ? customersData 
          : customersData?.data || customersData?.customers || [];

        setApiData({
          products: productsArray,
          customers: customersArray,
          isLoaded: true,
        });
      } catch (error) {
        setFormState({
          success: false,
          error: true,
          errorMessage:
            "Failed to load products and customers. Please try again.",
        });
        setApiData({
          products: [],
          customers: [],
          isLoaded: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  useEffect(() => {
    if (!productName || !apiData.isLoaded) return;

    const normalizedInput = productName.toLowerCase().trim();
    
    const productsArray = Array.isArray(apiData.products) ? apiData.products : [];
    
    const product =
      productsArray.find(
        (p) => p.name.toLowerCase().trim() === normalizedInput
      ) ||
      productsArray.find((p) =>
        p.name.toLowerCase().trim().includes(normalizedInput)
      );

    setSelectedProduct(product || null);

    if (product && product.name.toLowerCase().trim() !== normalizedInput) {
      setValue("product", product.name);
    }
  }, [productName, apiData.products, apiData.isLoaded, setValue]);

  useEffect(() => {
    if (type === "update" && data && apiData.isLoaded) {
      const productsArray = Array.isArray(apiData.products) ? apiData.products : [];
      const customersArray = Array.isArray(apiData.customers) ? apiData.customers : [];
      
      const productMatch = productsArray.find(
        (p) => p.id === data.productId
      );
      const customerMatch = customersArray.find(
        (c) => c.id === data.customerId
      );

      reset({
        id: data.id,
        product: productMatch?.name || data.product?.name || "",
        customer: customerMatch?.name || data.customer?.name || "",
        address: data.address || "",
        quantity: data.quantity,
        status: data.status,
      });

      if (productMatch) {
        setSelectedProduct(productMatch);
      }
    }
  }, [
    data,
    reset,
    type,
    apiData.isLoaded,
    apiData.products,
    apiData.customers,
  ]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!companyId) {
      setFormState({
        success: false,
        error: true,
        errorMessage:
          "Company ID not available. Please log in again.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const productsArray = Array.isArray(apiData.products) ? apiData.products : [];
      const customersArray = Array.isArray(apiData.customers) ? apiData.customers : [];
      
      const product = productsArray.find(
        (p) =>
          p.name.toLowerCase().trim() === formData.product.toLowerCase().trim()
      );

      const customer = customersArray.find(
        (c) =>
          c.name.toLowerCase().trim() === formData.customer.toLowerCase().trim()
      );

      if (!product || !customer) {
        const errorMessage = !product
          ? `Product "${formData.product}" not found in your company.`
          : `Customer "${formData.customer}" not found in your company.`;

        setFormState({ success: false, error: true, errorMessage });
        return;
      }

      const submissionData = {
        ...formData,
        productId: product.id,
        customerId: customer.id,
        totalAmount: totalAmount,
        companyId,
      };

      const result =
        type === "create"
          ? await createOrder({ success: false, error: false }, submissionData)
          : await updateOrder({ success: false, error: false }, submissionData);

      if (result?.success) {
        setFormState({
          success: true,
          error: false,
          errorMessage: "",
        });

        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setFormState({
        success: false,
        error: true,
        errorMessage:
          "Error processing your order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!companyId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle size={20} />
          <h2 className="font-semibold">Access Error</h2>
        </div>
        <p className="text-sm text-red-700">
          You must be authenticated and associated with a company to
          manage orders.
        </p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      {formState.success && (
        <div className="bg-green-50 text-green-800 border border-green-200 rounded-md p-3 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-medium">Operation Completed</p>
            <p className="text-sm">
              Order {type === "create" ? "created" : "updated"} successfully!
            </p>
          </div>
        </div>
      )}

      {formState.error && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Operation Error</p>
            <p className="text-sm">
              {formState.errorMessage ||
                "An error occurred while processing your request."}
            </p>
          </div>
        </div>
      )}

      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="product"
            className="text-gray-700 font-medium text-sm"
          >
            Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="product"
              className={`w-full border ${
                errors?.product
                  ? "border-red-500"
                  : selectedProduct
                  ? "border-green-500"
                  : "border-gray-300"
              } p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
              {...register("product")}
              list="product-options"
              placeholder="Select or type product name"
              disabled={isLoading}
            />
            <datalist id="product-options">
              {Array.isArray(apiData?.products) ? (
                apiData.products.map((product) => (
                  <option key={product.id} value={product.name} />
                ))
              ) : (
                <option value="Loading products..." />
              )}
            </datalist>
          </div>

          {errors?.product && (
            <span className="text-red-500 text-xs">
              {errors.product.message as string}
            </span>
          )}

          {selectedProduct && (
            <div className="text-xs text-green-600 flex flex-col">
              <span>Product found (ID: {selectedProduct.id})</span>
              <span>Unit price: ${selectedProduct.price?.toFixed(2)}</span>
            </div>
          )}

          {productName &&
            !selectedProduct &&
            !isLoading &&
            apiData.isLoaded && (
              <span className="text-yellow-600 text-xs">
                Product not found. Check the name or add a new product.
              </span>
            )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="customer"
            className="text-gray-700 font-medium text-sm"
          >
            Customer <span className="text-red-500">*</span>
          </label>
          <input
            id="customer"
            className={`w-full border ${
              errors?.customer
                ? "border-red-500"
                : customerName &&
                  Array.isArray(apiData.customers) &&
                  apiData.customers.some(
                    (c) => c.name.toLowerCase() === customerName.toLowerCase()
                  )
                ? "border-green-500"
                : "border-gray-300"
            } p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
            {...register("customer")}
            list="customer-options"
            placeholder="Select or type customer name"
            disabled={isLoading}
          />
          <datalist id="customer-options">
            {Array.isArray(apiData.customers) ? (
              apiData.customers.map((customer) => (
                <option key={customer.id} value={customer.name} />
              ))
            ) : (
              <option value="Loading customers..." />
            )}
          </datalist>

          {errors?.customer && (
            <span className="text-red-500 text-xs">
              {errors.customer.message as string}
            </span>
          )}

          {customerName &&
            Array.isArray(apiData.customers) &&
            !apiData.customers.some(
              (c) => c.name.toLowerCase() === customerName.toLowerCase()
            ) &&
            !isLoading &&
            apiData.isLoaded && (
              <span className="text-yellow-600 text-xs">
                Customer not found. Check the name or add a new customer.
              </span>
            )}
        </div>

        <InputField
          label="Delivery Address"
          name="address"
          register={register}
          error={errors?.address}
        />

        <div className="flex flex-col gap-2">
          <label
            htmlFor="quantity"
            className="text-gray-700 font-medium text-sm"
          >
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            className={`border ${
              errors?.quantity ? "border-red-500" : "border-gray-300"
            } 
                      p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
            {...register("quantity")}
            disabled={isLoading}
          />
          {errors?.quantity && (
            <span className="text-red-500 text-xs">
              {errors.quantity.message as string}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-gray-700 font-medium text-sm">
            Order Status
          </label>
          <select
            id="status"
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("status")}
            disabled={isLoading}
          >
            <option value="PENDING">PENDING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          {errors?.status && (
            <span className="text-red-500 text-xs">
              {errors.status.message as string}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium text-sm">
            Total Amount
          </label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 p-2 pl-7 rounded-md text-gray-700"
                value={totalAmount.toFixed(2)}
                readOnly
              />
            </div>
          </div>
          {errors?.quantity && (
            <span className="text-red-500 text-xs">
              {errors.quantity.message as string}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          className={`px-4 py-2 rounded-md text-white font-medium
                    ${
                      isSubmitting
                        ? "bg-gray-400 cursor-wait"
                        : type === "create"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-green-500 hover:bg-green-600"
                    } 
                    transition-colors flex items-center gap-2`}
          disabled={
            isSubmitting || isLoading || (!isDirty && type === "update")
          }
          type="submit"
        >
          {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
          {isSubmitting
            ? type === "create"
              ? "Creating..."
              : "Updating..."
            : type === "create"
            ? "Create Order"
            : "Save Changes"}
        </button>
      </div>
      
      {type === "update" && (
        <div className="text-xs text-gray-500 text-right mt-2">
          Last updated: {currentDate} by {currentUser}
        </div>
      )}
    </form>
  );
};

export default OrderForm;