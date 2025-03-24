"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { customerSchema } from "@/app/lib/formValidationSchemas";
import { createCustomer, updateCustomer } from "@/app/lib/actions";

type CustomerInputs = z.infer<typeof customerSchema>;

const CustomerForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({ 
    success: false, 
    error: false,
    errorMessage: ""
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInputs>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      address: ""
    }
  });

  useEffect(() => {
    if (type === "update" && data) {
      reset({
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        address: data.address || ""
      });
    }
  }, [data, reset, type]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });
    
    try {
      let result;
      
      if (type === "create") {
        result = await createCustomer({ success: false, error: false }, formData);
      } else {
        if (!formData.id) {
          setFormState({ success: false, error: true, errorMessage: "Customer ID is missing" });
          return;
        }
        
        result = await updateCustomer({ success: false, error: false }, formData);
      }
      
      if (result?.error) {
        setFormState({ 
          success: false, 
          error: true, 
          errorMessage: "Failed to save customer. The name or email might already be in use." 
        });
        return;
      }
      
      setFormState({ success: true, error: false, errorMessage: "" });
      
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      setFormState({ success: false, error: true, errorMessage: "An error occurred during submission" });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      {formState.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Customer {type === "create" ? "created" : "updated"} successfully!
        </div>
      )}
      
      {formState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formState.errorMessage || "An error occurred. Please try again."}
        </div>
      )}
      
      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="name" className="text-gray-700">Customer Name</label>
          <input
            id="name"
            className="border border-gray-300 p-2 rounded-md"
            {...register("name")}
            placeholder="Enter customer name"
          />
          {errors?.name && (
            <span className="text-red-500 text-sm">{errors.name.message as string}</span>
          )}
        </div>
        
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="email" className="text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            className="border border-gray-300 p-2 rounded-md"
            {...register("email")}
            placeholder="customer@example.com"
          />
          {errors?.email && (
            <span className="text-red-500 text-sm">{errors.email.message as string}</span>
          )}
        </div>
        
        <div className="flex flex-col w-full gap-2">
          <label htmlFor="address" className="text-gray-700">Address</label>
          <textarea
            id="address"
            className="border border-gray-300 p-2 rounded-md"
            {...register("address")}
            placeholder="Enter customer address"
            rows={3}
          />
          {errors?.address && (
            <span className="text-red-500 text-sm">{errors.address.message as string}</span>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {type === "update" && `Last updated: 2025-03-24 11:17:28 by sebastianascimento`}
      </div>
      
      <button 
        className={`${isSubmitting ? 'bg-gray-400' : type === 'create' ? 'bg-blue-400' : 'bg-green-500'} text-white p-2 rounded-md`}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 
          (type === "create" ? "Creating..." : "Updating...") : 
          (type === "create" ? "Create" : "Update")
        }
      </button>
    </form>
  );
};

export default CustomerForm;