"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import InputField from "../InputField";
import { orderSchema } from "@/app/lib/formValidationSchemas";
import { createOrder, updateOrder } from "@/app/lib/actions";

type OrderInputs = z.infer<typeof orderSchema>;

// Interfaces para os dados
interface Product {
  id: number;
  name: string;
  price?: number;
}

interface Customer {
  id: number;
  name: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({ 
    success: false, 
    error: false,
    errorMessage: ""
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [productExists, setProductExists] = useState<boolean | null>(null);
  const [customerExists, setCustomerExists] = useState<boolean | null>(null);
  const [productInput, setProductInput] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderInputs>({
    resolver: zodResolver(orderSchema),
  });
  
  // Observar as mudanças na quantidade e no produto
  const quantity = watch("quantity");
  const productName = watch("product");
  const customerName = watch("customer");

  // Buscar produtos e clientes quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar produtos
        const productsResponse = await fetch('/api/products');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData);
          console.log("Produtos carregados:", productsData);
        } else {
          console.error("Erro ao buscar produtos:", await productsResponse.text());
        }
        
        // Buscar clientes
        const customersResponse = await fetch('/api/customers');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData);
        } else {
          console.error("Erro ao buscar clientes:", await customersResponse.text());
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Verificar se o produto existe com comparação melhorada
  useEffect(() => {
    if (!productName || !products.length) {
      setProductExists(null);
      setSelectedProduct(null);
      setTotalAmount(0);
      return;
    }

    // Preparar o nome do produto para comparação
    const normalizedInput = productName.toLowerCase().trim();
    
    // Listar todos os produtos para depuração
    const productNames = products.map(p => p.name.toLowerCase().trim());
    setDebugInfo(`Procurando: "${normalizedInput}" em [${productNames.join(", ")}]`);

    // Localizar produto com comparação melhorada
    const product = products.find(p => 
      p.name.toLowerCase().trim() === normalizedInput
    );
    
    // Se ainda não encontrar, tente uma busca por substring
    if (!product && products.length > 0) {
      const similarProduct = products.find(p => 
        p.name.toLowerCase().trim().includes(normalizedInput) || 
        normalizedInput.includes(p.name.toLowerCase().trim())
      );
      
      if (similarProduct) {
        setProductExists(true);
        setSelectedProduct(similarProduct);
        // Atualizar o campo para o nome exato do produto
        setValue("product", similarProduct.name);
        setProductInput(similarProduct.name);
        
        if (similarProduct.price && quantity) {
          setTotalAmount(similarProduct.price * Number(quantity));
        }
        return;
      }
    }
    
    setProductExists(!!product);
    setSelectedProduct(product || null);
    
    if (product && product.price && quantity) {
      setTotalAmount(product.price * Number(quantity));
    } else {
      setTotalAmount(0);
    }
  }, [productName, products, quantity, setValue]);

  // Verificar se o cliente existe com comparação melhorada
  useEffect(() => {
    if (!customerName) {
      setCustomerExists(null);
      return;
    }

    const normalizedInput = customerName.toLowerCase().trim();
    
    const customer = customers.find(c => 
      c.name.toLowerCase().trim() === normalizedInput
    );
    
    // Se ainda não encontrar, tente uma busca por substring
    if (!customer && customers.length > 0) {
      const similarCustomer = customers.find(c => 
        c.name.toLowerCase().trim().includes(normalizedInput) || 
        normalizedInput.includes(c.name.toLowerCase().trim())
      );
      
      if (similarCustomer) {
        setCustomerExists(true);
        setValue("customer", similarCustomer.name);
        setCustomerInput(similarCustomer.name);
        return;
      }
    }
    
    setCustomerExists(!!customer);
  }, [customerName, customers, setValue]);

  // Carregar os dados do pedido quando for update
  useEffect(() => {
    if (type === "update" && data) {
      console.log("Setting form data for update:", data);
      reset({
        id: data.id,
        product: data.product?.name || "",
        customer: data.customer?.name || "",
        address: data.address || "",
        quantity: data.quantity,
        status: data.status,
      });
      
      setProductInput(data.product?.name || "");
      setCustomerInput(data.customer?.name || "");
      
      if (data.product?.price && data.quantity) {
        setTotalAmount(data.product.price * data.quantity);
      }
    }
  }, [data, reset, type]);

  // Efeitos para sincronizar os inputs com os valores do form
  useEffect(() => {
    if (productName) setProductInput(productName);
  }, [productName]);
  
  useEffect(() => {
    if (customerName) setCustomerInput(customerName);
  }, [customerName]);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setFormState({ success: false, error: false, errorMessage: "" });
    
    // Verificar se o produto existe antes de submeter
    if (!productExists && type === "create") {
      setFormState({ 
        success: false, 
        error: true,
        errorMessage: `Product "${formData.product}" does not exist. Please add it to the products list first.`
      });
      setIsSubmitting(false);
      return;
    }
    
    // Verificar se o cliente existe antes de submeter
    if (!customerExists && type === "create") {
      setFormState({ 
        success: false, 
        error: true,
        errorMessage: `Customer "${formData.customer}" does not exist. Please add the customer first.`
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log(`Form type: ${type}`);
    console.log("Form data:", formData);
    
    try {
      // Adicionar o ID do produto e do cliente aos dados do formulário
      const product = products.find(p => 
        p.name.toLowerCase().trim() === formData.product.toLowerCase().trim()
      );
      const customer = customers.find(c => 
        c.name.toLowerCase().trim() === formData.customer.toLowerCase().trim()
      );
      
      const submissionData = {
        ...formData,
        productId: product?.id,
        customerId: customer?.id,
        totalAmount: totalAmount
      };
      
      console.log("Submission data:", submissionData);
      
      let result;
      
      if (type === "create") {
        result = await createOrder({ success: false, error: false }, submissionData);
      } else {
        // Para atualização, certifique-se que o ID está presente
        if (!formData.id) {
          console.error("Missing ID for update operation!");
          setFormState({ success: false, error: true, errorMessage: "Order ID is missing" });
          return;
        }
        
        console.log(`Updating order with ID: ${formData.id}`);
        result = await updateOrder({ success: false, error: false }, submissionData);
      }
      
      setFormState({ success: true, error: false, errorMessage: "" });
      
      // Se for bem-sucedido, fechar o modal após um pequeno atraso
      if (result?.success) {
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setFormState({ success: false, error: true, errorMessage: "An error occurred during submission" });
    } finally {
      setIsSubmitting(false);
    }
  });

  // Manipuladores para campos de texto com sugestão
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductInput(value);
    setValue("product", value);
  };
  
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerInput(value);
    setValue("customer", value);
  };

  // Função para forçar a pesquisa do produto
  const handleForceProductSelection = () => {
    const product = products.find(p => p.name.toLowerCase().includes(productInput.toLowerCase()));
    if (product) {
      setValue("product", product.name);
      setProductInput(product.name);
      setProductExists(true);
      setSelectedProduct(product);
      if (product.price && quantity) {
        setTotalAmount(product.price * Number(quantity));
      }
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new order" : "Update order"}
      </h1>

      {formState.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Order {type === "create" ? "created" : "updated"} successfully!
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
        {/* Campo de produto com validação e autocompletar - CORRIGIDO */}
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="product" className="text-gray-700">Product Name</label>
          <div className="flex gap-2">
            <input
              id="product"
              className={`border ${
                productExists === true ? 'border-green-500' : 
                productExists === false ? 'border-red-500' : 
                'border-gray-300'
              } p-2 rounded-md flex-1`}
              value={productInput}
              onChange={(e) => handleProductChange(e)}
              list="product-options"
              name="product"
              ref={register("product").ref}
              onBlur={register("product").onBlur}
              placeholder="Select product"
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-3 rounded-md"
              onClick={handleForceProductSelection}
            >
              Find
            </button>
          </div>
          <datalist id="product-options">
            {products.map((product) => (
              <option key={product.id} value={product.name} />
            ))}
          </datalist>
          {errors?.product && (
            <span className="text-red-500 text-sm">{errors.product.message as string}</span>
          )}
          {productExists === false && (
            <div>
              <span className="text-red-500 text-sm">
                This product doesn't exist in the system. Please add it first.
              </span>
              <details className="text-xs text-gray-500 mt-1">
                <summary>Debug info</summary>
                <p>{debugInfo}</p>
                <p>Available products: {products.length}</p>
                <ul className="ml-4 list-disc">
                  {products.slice(0, 10).map((p, i) => (
                    <li key={i}>{p.name} (ID: {p.id})</li>
                  ))}
                  {products.length > 10 && <li>...and {products.length - 10} more</li>}
                </ul>
              </details>
            </div>
          )}
          {selectedProduct && productExists && (
            <span className="text-green-600 text-sm">
              Price: ${selectedProduct.price?.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Campo de cliente com validação e autocompletar - CORRIGIDO */}
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="customer" className="text-gray-700">Customer Name</label>
          <input
            id="customer"
            className={`border ${
              customerExists === true ? 'border-green-500' : 
              customerExists === false ? 'border-red-500' : 
              'border-gray-300'
            } p-2 rounded-md`}
            value={customerInput}
            onChange={(e) => handleCustomerChange(e)}
            list="customer-options"
            name="customer"
            ref={register("customer").ref}
            onBlur={register("customer").onBlur}
            placeholder="Select customer"
          />
          <datalist id="customer-options">
            {customers.map((customer) => (
              <option key={customer.id} value={customer.name} />
            ))}
          </datalist>
          {errors?.customer && (
            <span className="text-red-500 text-sm">{errors.customer.message as string}</span>
          )}
          {customerExists === false && (
            <span className="text-red-500 text-sm">
              This customer doesn't exist in the system. Please add them first.
            </span>
          )}
        </div>
        
        <InputField
          label="Shipping Address"
          name="address"
          register={register}
          error={errors?.address}
        />
        
        <InputField
          label="Quantity"
          name="quantity"
          type="number"
          register={register}
          error={errors?.quantity}
        />
        
        {/* Campo de Total Amount (somente leitura) */}
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="totalAmount" className="text-gray-700">Total Amount</label>
          <input 
            id="totalAmount"
            type="text"
            className="border border-gray-300 p-2 rounded-md bg-gray-100"
            value={`$${totalAmount.toFixed(2)}`}
            readOnly
          />
          <p className="text-xs text-gray-500">
            This value is calculated automatically based on product price and quantity
          </p>
        </div>
        
        <div className="flex flex-col w-full sm:w-[48%] gap-2">
          <label htmlFor="status" className="text-gray-700">Order Status</label>
          <select 
            id="status" 
            className="border border-gray-300 p-2 rounded-md"
            {...register("status")}
          >
            <option value="PENDING">PENDING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          {errors?.status && (
            <span className="text-red-500 text-sm">{errors.status.message as string}</span>
          )}
        </div>
      </div>
      
      <button 
        className={`${isSubmitting ? 'bg-gray-400' : type === 'create' ? 'bg-blue-400' : 'bg-green-500'} text-white p-2 rounded-md`}
        disabled={isSubmitting || loading || (productExists === false && type === "create") || (customerExists === false && type === "create")}
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

export default OrderForm;