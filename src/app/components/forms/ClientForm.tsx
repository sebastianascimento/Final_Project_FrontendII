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
    watch,
    formState: { errors },
  } = useForm<CustomerInputs>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      picture: ""
    }
  });

  // Usar watch para obter o valor atual do campo de imagem
  const pictureUrl = watch("picture");

  // Carregar os dados do cliente quando for update
  useEffect(() => {
    if (type === "update" && data) {
      console.log("Setting form data for update:", data);
      reset({
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        address: data.address || "",
        picture: data.picture || "",
      });
    }
  }, [data, reset, type]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });
    
    console.log(`Form type: ${type}`);
    console.log("Form data:", formData);
    
    try {
      let result;
      
      if (type === "create") {
        result = await createCustomer({ success: false, error: false }, formData);
      } else {
        // Para atualização, certifique-se que o ID está presente
        if (!formData.id) {
          console.error("Missing ID for update operation!");
          setFormState({ success: false, error: true, errorMessage: "Customer ID is missing" });
          return;
        }
        
        console.log(`Updating customer with ID: ${formData.id}`);
        result = await updateCustomer({ success: false, error: false }, formData);
      }
      
      // Verificar se há erro no resultado
      if (result?.error) {
        setFormState({ 
          success: false, 
          error: true, 
          // Usar uma mensagem genérica ou extrair do resultado se estiver disponível
          errorMessage: "Failed to save customer. The name or email might already be in use." 
        });
        return;
      }
      
      setFormState({ success: true, error: false, errorMessage: "" });
      
      // Se for bem-sucedido, fechar o modal após um pequeno atraso
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error in form submission:", error);
      setFormState({ success: false, error: true, errorMessage: "An error occurred during submission" });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new customer" : "Update customer"}
      </h1>

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
      
      {/* Campo oculto para o ID (necessário para atualização) */}
      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="flex justify-between flex-wrap gap-4">
        {/* Nome do Cliente */}
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
        
        {/* Email do Cliente */}
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
        
        {/* Endereço do Cliente */}
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
        
        {/* URL da Imagem (opcional) */}
        <div className="flex flex-col w-full gap-2">
          <label htmlFor="picture" className="text-gray-700">
            Profile Picture URL <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            id="picture"
            type="url"
            className="border border-gray-300 p-2 rounded-md"
            {...register("picture")}
            placeholder="https://example.com/image.jpg"
          />
          {errors?.picture && (
            <span className="text-red-500 text-sm">{errors.picture.message as string}</span>
          )}
          <p className="text-xs text-gray-500">
            Leave empty if no profile picture is available
          </p>
        </div>

        {/* Visualização da imagem se houver URL */}
        {pictureUrl && (
          <div className="w-full flex justify-center my-2">
            <div className="relative w-32 h-32 border rounded-md overflow-hidden">
              <img 
                src={pictureUrl} 
                alt="Customer preview" 
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150?text=Invalid+Image";
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Informação de criação - data atual */}
      <div className="text-xs text-gray-500 mt-1">
        {type === "create" ? "Will be created" : "Last updated"}: 2025-03-11 10:25:50 UTC
        {type === "update" && data?.updatedBy && (
          <span> by {data.updatedBy}</span>
        )}
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