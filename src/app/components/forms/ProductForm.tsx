"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import InputField from "../InputField";
import { productSchema } from "@/app/lib/formValidationSchemas";
import { createProduct, updateProduct } from "@/app/lib/actions";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";

type ProductInputs = z.infer<typeof productSchema>;

interface FormState {
  success: boolean;
  error: boolean;
  errorMessage: string;
}

const ProductForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    success: false,
    error: false,
    errorMessage: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    watch,
  } = useForm<ProductInputs>({
    resolver: zodResolver(productSchema),
    defaultValues: data || {},
  });

  useEffect(() => {
    if (type === "update" && data?.id) {
      reset({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,
        categoryName: data.categoryName || "",
        brandName: data.brandName || "",
        supplierName: data.supplierName || "",
      });
    }
  }, [data, type, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!companyId) {
      setFormState({
        success: false,
        error: true,
        errorMessage: "Company ID not available. Please log in again.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });

    try {
      const result =
        type === "create"
          ? await createProduct({ success: false, error: false }, formData)
          : await updateProduct(
              { success: false, error: false },
              { ...formData, id: data.id }
            );

      if (result?.success) {
        setFormState({
          success: true,
          error: false,
          errorMessage: "",
        });

        if (setOpen) {
          setTimeout(() => {
            setOpen(false);
            window.location.reload();
          }, 1500);
        }
      } else if (result?.error) {
        setFormState({
          success: false,
          error: true,
          errorMessage: result.message || "Error processing your request",
        });
      }
    } catch (error) {
      setFormState({
        success: false,
        error: true,
        errorMessage: "Error processing your request. Please try again.",
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
          You must be authenticated and associated with a company to manage
          products.
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
              Product {type === "create" ? "created" : "updated"} successfully!
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
        <InputField
          label="Product Name"
          name="name"
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Description"
          name="description"
          register={register}
          error={errors?.description}
        />
        <InputField
          label="Category"
          name="categoryName"
          register={register}
          error={errors?.categoryName}
        />
        <InputField
          label="Brand"
          name="brandName"
          register={register}
          error={errors?.brandName}
        />
        <InputField
          label="Supplier"
          name="supplierName"
          register={register}
          error={errors?.supplierName}
        />
        <InputField
          label="Price"
          name="price"
          type="number"
          register={register}
          error={errors?.price}
        />
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
          disabled={isSubmitting || (!isDirty && type === "update")}
          type="submit"
        >
          {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
          {isSubmitting
            ? type === "create"
              ? "Creating..."
              : "Updating..."
            : type === "create"
            ? "Create Product"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;