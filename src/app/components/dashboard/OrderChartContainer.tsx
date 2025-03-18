"use client";

import React from 'react';
import Image from "next/image";
import OrderChart from "./OrderChart";
import { useSession } from "next-auth/react";
import { Building } from "lucide-react";

// Tipagem forte para os dados processados
interface ProcessedData {
  name: string;
  orders: number;
}

const OrderChartContainer = () => {
  const [data, setData] = React.useState<ProcessedData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // MULTI-TENANT: Obter informações da sessão do usuário
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  // Dados atuais conforme solicitado
  const currentDate = "2025-03-15 09:09:10";
  const currentUser = "sebastianascimento";

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar se temos uma empresa configurada
        if (status !== "loading" && !companyId) {
          console.log(`[${currentDate}] ${currentUser} - Tentando acessar dados de pedidos sem empresa configurada`);
          setError("company_not_configured");
          setLoading(false);
          return;
        }

        // Aguardar o carregamento da sessão
        if (status === "loading") {
          return;
        }
        
        // MULTI-TENANT: Adicionar companyId como parâmetro de consulta
        console.log(`[${currentDate}] ${currentUser} - Buscando dados semanais para empresa: ${companyId}`);
        const response = await fetch(`/api/orders/weekly-stats?companyId=${companyId}`);
        
        if (!response.ok) {
          console.error(`[${currentDate}] ${currentUser} - Erro ao buscar dados: ${response.status}`);
          throw new Error(`Failed to fetch order data: ${response.statusText}`);
        }
        
        const resData = await response.json();
        // Verificar e garantir o formato correto dos dados
        if (Array.isArray(resData)) {
          setData(resData);
          console.log(`[${currentDate}] ${currentUser} - Dados carregados: ${resData.length} dias para empresa ${companyId}`);
        } else {
          console.error(`[${currentDate}] ${currentUser} - Formato de dados inválido recebido`);
          setData([]);
          setError("invalid_data_format");
        }
      } catch (error) {
        console.error(`[${currentDate}] ${currentUser} - Erro ao buscar dados:`, error);
        setData([]);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, status, currentDate, currentUser]);

  // MULTI-TENANT: Tratar carregamento da sessão
  if (status === "loading") {
    return (
      <div className="bg-white rounded-lg p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Carregando informações de usuário...</span>
      </div>
    );
  }

  // MULTI-TENANT: Mostrar mensagem quando não há empresa configurada
  if (error === "company_not_configured" || (!loading && !companyId)) {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Orders of the week</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] p-4">
          <Building size={32} className="text-amber-500 mb-3" />
          <h3 className="text-gray-800 font-medium mb-2">Empresa não configurada</h3>
          <p className="text-gray-600 text-center text-sm mb-4">
            Para visualizar os pedidos da semana, configure sua empresa primeiro.
          </p>
          <a 
            href="/setup-company" 
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Configurar Empresa
          </a>
        </div>
      </div>
    );
  }

  // Mostrar estado de carregamento
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mostrar mensagem de erro (exceto para company_not_configured que já é tratado)
  if (error && error !== "company_not_configured") {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Orders of the week</h1>
        </div>
        
        <div className="flex items-center justify-center h-[calc(100%-40px)]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Erro ao carregar dados</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold flex items-center">
          Orders of the week
          {/* MULTI-TENANT: Mostrar nome da empresa quando disponível */}
          {companyName && (
            <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
          )}
        </h1>
        <Image 
          src="/moreDark.png" 
          alt="More options" 
          width={20} 
          height={20}
          className="cursor-pointer"
        />
      </div>
      
      {data.length > 0 ? (
        <OrderChart data={data} />
      ) : (
        <div className="flex items-center justify-center h-[calc(100%-40px)] text-gray-500">
          No orders data available for your company
        </div>
      )}
    </div>
  );
};

export default OrderChartContainer;