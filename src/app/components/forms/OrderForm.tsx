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

// Interfaces para os dados
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
  // MULTI-TENANT: Obter sessão para acessar o companyId
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;
  
  // Estado para controle do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({ 
    success: false, 
    error: false,
    errorMessage: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<{
    products: Product[];
    customers: Customer[];
    isLoaded: boolean;
  }>({
    products: [],
    customers: [],
    isLoaded: false
  });
  
  // Estado para as entradas e seleções
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentDate] = useState<string>("2025-03-17 20:08:14");
  const [currentUser] = useState<string>("sebastianascimento");

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
  
  // Valores observados do formulário
  const quantity = watch("quantity");
  const productName = watch("product");
  const customerName = watch("customer");
  
  // Cálculo do valor total
  const totalAmount = useMemo(() => {
    if (selectedProduct?.price && quantity) {
      return selectedProduct.price * Number(quantity);
    }
    return 0;
  }, [selectedProduct, quantity]);

  // Busca de produtos e clientes específicos da empresa (MULTI-TENANT)
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        console.log(`[${currentDate}] @${currentUser} - CompanyId não disponível, aguardando sessão...`);
        return;
      }

      setIsLoading(true);
      console.log(`[${currentDate}] @${currentUser} - Buscando dados da empresa ${companyId}`);

      try {
        // MULTI-TENANT: Adicionar companyId como parâmetro nas requisições
        const [productsResponse, customersResponse] = await Promise.all([
          fetch(`/api/products?companyId=${companyId}`),
          fetch(`/api/customers?companyId=${companyId}`)
        ]);

        if (!productsResponse.ok || !customersResponse.ok) {
          throw new Error("Falha ao buscar dados da empresa");
        }

        const products = await productsResponse.json();
        const customers = await customersResponse.json();
        
        console.log(`[${currentDate}] @${currentUser} - Dados carregados: ${products.length} produtos, ${customers.length} clientes`);
        
        setApiData({
          products,
          customers,
          isLoaded: true
        });
      } catch (error) {
        console.error(`[${currentDate}] @${currentUser} - Erro ao carregar dados:`, error);
        setFormState({
          success: false,
          error: true,
          errorMessage: "Falha ao carregar produtos e clientes. Por favor, tente novamente."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, currentDate, currentUser]);

  // Validação e seleção de produto quando o nome muda
  useEffect(() => {
    if (!productName || !apiData.isLoaded) return;

    const normalizedInput = productName.toLowerCase().trim();
    
    // Buscar produto correspondente
    const product = apiData.products.find(p => 
      p.name.toLowerCase().trim() === normalizedInput
    ) || apiData.products.find(p => 
      p.name.toLowerCase().trim().includes(normalizedInput)
    );

    setSelectedProduct(product || null);
    
    // Se encontrar um produto por correspondência parcial, atualizar o input
    if (product && product.name.toLowerCase().trim() !== normalizedInput) {
      setValue("product", product.name);
    }
  }, [productName, apiData.products, apiData.isLoaded, setValue]);

  // Carregar dados iniciais para edição
  useEffect(() => {
    if (type === "update" && data && apiData.isLoaded) {
      console.log(`[${currentDate}] @${currentUser} - Configurando formulário para atualização do pedido ${data.id}`);
      
      // Encontrar o produto e cliente nos dados carregados
      const productMatch = apiData.products.find(p => p.id === data.productId);
      const customerMatch = apiData.customers.find(c => c.id === data.customerId);

      reset({
        id: data.id,
        product: productMatch?.name || data.product?.name || "",
        customer: customerMatch?.name || data.customer?.name || "",
        address: data.address || "",
        quantity: data.quantity,
        status: data.status,
      });

      // Atualizar o produto selecionado para cálculo de valor
      if (productMatch) {
        setSelectedProduct(productMatch);
      }
    }
  }, [data, reset, type, apiData.isLoaded, apiData.products, apiData.customers, currentDate, currentUser]);

  // Handler de envio do formulário
  const onSubmit = handleSubmit(async (formData) => {
    if (!companyId) {
      setFormState({ 
        success: false, 
        error: true,
        errorMessage: "ID da empresa não disponível. Por favor, faça login novamente."
      });
      return;
    }

    setIsSubmitting(true);
    console.log(`[${currentDate}] @${currentUser} - Enviando formulário de ${type === "create" ? "criação" : "atualização"} de pedido`);

    try {
      // Encontrar IDs de produto e cliente baseado nos nomes
      const product = apiData.products.find(p => 
        p.name.toLowerCase().trim() === formData.product.toLowerCase().trim()
      );
      
      const customer = apiData.customers.find(c => 
        c.name.toLowerCase().trim() === formData.customer.toLowerCase().trim()
      );

      // Validar se produto e cliente existem
      if (!product || !customer) {
        const errorMessage = !product 
          ? `Produto "${formData.product}" não encontrado na sua empresa.` 
          : `Cliente "${formData.customer}" não encontrado na sua empresa.`;
          
        setFormState({ success: false, error: true, errorMessage });
        return;
      }

      // MULTI-TENANT: Adicionar companyId aos dados de envio
      const submissionData = {
        ...formData,
        productId: product.id,
        customerId: customer.id,
        totalAmount: totalAmount,
        companyId // Incluir companyId nos dados do pedido
      };
      
      console.log(`[${currentDate}] @${currentUser} - Dados para envio:`, {
        operationType: type,
        orderId: formData.id || 'novo',
        productId: product.id,
        customerId: customer.id,
        companyId
      });
      
      // Chamar a função apropriada baseada no tipo
      const result = type === "create"
        ? await createOrder({ success: false, error: false }, submissionData)
        : await updateOrder({ success: false, error: false }, submissionData);
      
      // Processar o resultado
      if (result?.success) {
        console.log(`[${currentDate}] @${currentUser} - Pedido ${type === "create" ? "criado" : "atualizado"} com sucesso`);
        setFormState({ 
          success: true, 
          error: false, 
          errorMessage: "" 
        });
        
        // Fechar o modal após um breve delay
        setTimeout(() => {
          setOpen(false);
          // Recarregar página para mostrar alterações
          window.location.reload();
        }, 1500);
      } else {
      }
    } catch (error) {
      console.error(`[${currentDate}] @${currentUser} - Erro ao processar formulário:`, error);
      setFormState({
        success: false,
        error: true,
        errorMessage: "Erro ao processar seu pedido. Por favor, tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  // Verificações de erros críticos
  if (!companyId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle size={20} />
          <h2 className="font-semibold">Erro de Acesso</h2>
        </div>
        <p className="text-sm text-red-700">
          Você precisa estar autenticado e associado a uma empresa para gerenciar pedidos.
        </p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        {type === "create" ? "Criar novo pedido" : "Atualizar pedido"}
        {isLoading && <Loader className="h-4 w-4 animate-spin ml-2" />}
      </h1>

      {/* Mensagens de status do formulário */}
      {formState.success && (
        <div className="bg-green-50 text-green-800 border border-green-200 rounded-md p-3 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-medium">Operação concluída</p>
            <p className="text-sm">Pedido {type === "create" ? "criado" : "atualizado"} com sucesso!</p>
          </div>
        </div>
      )}
      
      {formState.error && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Erro na operação</p>
            <p className="text-sm">{formState.errorMessage || "Ocorreu um erro ao processar sua solicitação."}</p>
          </div>
        </div>
      )}
      
      {/* Campo oculto para o ID (necessário para atualização) */}
      {type === "update" && <input type="hidden" {...register("id")} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Campo de produto com lista de sugestões */}
        <div className="flex flex-col gap-2">
          <label htmlFor="product" className="text-gray-700 font-medium text-sm">
            Produto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="product"
              className={`w-full border ${
                errors?.product ? 'border-red-500' : 
                selectedProduct ? 'border-green-500' : 
                'border-gray-300'
              } p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
              {...register("product")}
              list="product-options"
              placeholder="Selecione ou digite o nome do produto"
              disabled={isLoading}
            />
            <datalist id="product-options">
              {apiData.products.map((product) => (
                <option key={product.id} value={product.name} />
              ))}
            </datalist>
          </div>
          
          {errors?.product && (
            <span className="text-red-500 text-xs">{errors.product.message as string}</span>
          )}
          
          {selectedProduct && (
            <div className="text-xs text-green-600 flex flex-col">
              <span>Produto encontrado (ID: {selectedProduct.id})</span>
              <span>Preço unitário: ${selectedProduct.price?.toFixed(2)}</span>
            </div>
          )}
          
          {productName && !selectedProduct && !isLoading && apiData.isLoaded && (
            <span className="text-yellow-600 text-xs">
              Produto não encontrado. Verifique o nome ou adicione um novo produto.
            </span>
          )}
        </div>
        
        {/* Campo de cliente com lista de sugestões */}
        <div className="flex flex-col gap-2">
          <label htmlFor="customer" className="text-gray-700 font-medium text-sm">
            Cliente <span className="text-red-500">*</span>
          </label>
          <input
            id="customer"
            className={`w-full border ${
              errors?.customer ? 'border-red-500' : 
              customerName && apiData.customers.some(c => c.name.toLowerCase() === customerName.toLowerCase()) 
                ? 'border-green-500' : 
                'border-gray-300'
            } p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
            {...register("customer")}
            list="customer-options"
            placeholder="Selecione ou digite o nome do cliente"
            disabled={isLoading}
          />
          <datalist id="customer-options">
            {apiData.customers.map((customer) => (
              <option key={customer.id} value={customer.name} />
            ))}
          </datalist>
          
          {errors?.customer && (
            <span className="text-red-500 text-xs">{errors.customer.message as string}</span>
          )}
          
          {customerName && !apiData.customers.some(c => c.name.toLowerCase() === customerName.toLowerCase()) && 
           !isLoading && apiData.isLoaded && (
            <span className="text-yellow-600 text-xs">
              Cliente não encontrado. Verifique o nome ou adicione um novo cliente.
            </span>
          )}
        </div>
        
        {/* Campo de endereço */}
        <InputField
          label="Endereço de Entrega"
          name="address"
          register={register}
          error={errors?.address}
        />
        
        {/* Campo de quantidade */}
        <div className="flex flex-col gap-2">
          <label htmlFor="quantity" className="text-gray-700 font-medium text-sm">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            className={`border ${errors?.quantity ? 'border-red-500' : 'border-gray-300'} 
                      p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
            {...register("quantity")}
            disabled={isLoading}
          />
          {errors?.quantity && (
            <span className="text-red-500 text-xs">{errors.quantity.message as string}</span>
          )}
        </div>
        
        {/* Status do pedido */}
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-gray-700 font-medium text-sm">
            Status do Pedido
          </label>
          <select 
            id="status" 
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("status")}
            disabled={isLoading}
          >
            <option value="PENDING">PENDENTE</option>
            <option value="PROCESSING">EM PROCESSAMENTO</option>
            <option value="SHIPPED">ENVIADO</option>
            <option value="DELIVERED">ENTREGUE</option>
            <option value="CANCELLED">CANCELADO</option>
          </select>
          {errors?.status && (
            <span className="text-red-500 text-xs">{errors.status.message as string}</span>
          )}
        </div>
        
        {/* Campo de valor total (somente leitura) */}
        <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
          <label className="text-gray-700 font-medium text-sm">
            Valor Total
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
            {selectedProduct && quantity ? (
              <div className="text-xs text-gray-500 ml-2">
                {selectedProduct.price?.toFixed(2)} × {quantity} = ${totalAmount.toFixed(2)}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            Valor calculado automaticamente baseado no preço do produto e quantidade
          </p>
        </div>
      </div>
      
      {/* Informações da empresa (Multi-tenant) */}
      <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
        <h3 className="text-sm text-blue-800 font-medium mb-1">Informações da Empresa</h3>
        <p className="text-xs text-blue-600">
          Este pedido será associado à sua empresa (ID: {companyId})
        </p>
      </div>
      
      {/* Botão de submissão */}
      <div className="flex justify-end mt-4">
        <button 
          className={`px-4 py-2 rounded-md text-white font-medium
                    ${isSubmitting ? 'bg-gray-400 cursor-wait' : 
                      type === 'create' ? 'bg-blue-500 hover:bg-blue-600' : 
                      'bg-green-500 hover:bg-green-600'} 
                    transition-colors flex items-center gap-2`}
          disabled={isSubmitting || isLoading || (!isDirty && type === "update")}
          type="submit"
        >
          {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
          {isSubmitting 
            ? (type === "create" ? "Criando..." : "Atualizando...") 
            : (type === "create" ? "Criar Pedido" : "Salvar Alterações")
          }
        </button>
      </div>
    </form>
  );
};

export default OrderForm;