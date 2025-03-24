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
  
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (!companyId && status !== "loading") {
          setError("company_not_configured");
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/orders/monthly-stats?companyId=${companyId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly order data: ${response.statusText}`);
        }
        
        const resData = await response.json();
        if (Array.isArray(resData)) {
          setData(resData);
        } else {
          setData([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro desconhecido");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [companyId, status]);

  if (status === "loading" || loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
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
    </div>
  );
};

export default MonthlyOrderChartContainer;