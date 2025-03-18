"use client";

import React from 'react';
import Image from "next/image";
import MonthlyOrderChart from "./MonthlyOrderChart";
import { useSession } from "next-auth/react";

interface MonthlyData {
  name: string;
  orders: number;
}

const MonthlyOrderChartContainer = () => {
  const [data, setData] = React.useState<MonthlyData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // MULTI-TENANT: Obter dados da sessão para identificar a empresa do usuário
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar primeiro se há uma empresa configurada
        if (!companyId && status !== "loading") {
          console.log("[2025-03-14 20:47:26] @sebastianascimento - Usuário sem empresa tentando acessar estatísticas mensais");
          setError("company_not_configured");
          setLoading(false);
          return;
        }
        
        // MULTI-TENANT: Incluir companyId como parâmetro na chamada da API
        const response = await fetch(`/api/orders/monthly-stats?companyId=${companyId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly order data: ${response.statusText}`);
        }
        
        const resData = await response.json();
        if (Array.isArray(resData)) {
          setData(resData);
          console.log(`[2025-03-14 20:47:26] @sebastianascimento - Dados mensais carregados: ${resData.length} meses para empresa ${companyId}`);
        } else {
          console.error("[2025-03-14 20:47:26] @sebastianascimento - Formato de dados inválido recebido");
          setData([]);
        }
      } catch (error) {
        console.error("[2025-03-14 20:47:26] @sebastianascimento - Erro ao buscar dados mensais:", error);
        setError(error instanceof Error ? error.message : "Erro desconhecido");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar dados se o status da sessão não estiver carregando
    if (status !== "loading") {
      fetchData();
    }
  }, [companyId, status]);

  // MULTI-TENANT: Mostrar estado de carregamento enquanto a sessão está sendo carregada
  if (status === "loading" || loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // MULTI-TENANT: Mostrar mensagem para configurar empresa se não houver empresa
  if (error === "company_not_configured" || !companyId) {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Monthly Orders</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] text-gray-500 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mb-2 text-center font-medium">Empresa não configurada</p>
          <p className="text-center text-sm mb-4">Configure sua empresa para visualizar estatísticas de pedidos mensais.</p>
          <a 
            href="/setup-company" 
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Configurar Empresa
          </a>
        </div>
      </div>
    );
  }
  
  // MULTI-TENANT: Mostrar erro genérico
  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Monthly Orders</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mb-2 text-center">Erro ao carregar dados</p>
          <p className="text-center text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">
          Monthly Orders
          {companyName && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({companyName})
            </span>
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
        <MonthlyOrderChart data={data} />
      ) : (
        <div className="flex items-center justify-center h-[calc(100%-40px)] text-gray-500">
          No monthly order data available for your company
        </div>
      )}
      
      {/* Selo da empresa para diagnóstico */}
      <div className="mt-4 text-xs text-right text-gray-400">
        <span>Company ID: {companyId}</span>
        <span className="ml-1 text-gray-300">•</span>
        <span className="ml-1">{new Date().toISOString().split('T')[0]}</span>
      </div>
    </div>
  );
};

export default MonthlyOrderChartContainer;