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
  const [isMobile, setIsMobile] = React.useState(false);
  
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          const processedData = resData.map(item => ({
            ...item,
            name: isMobile ? getMonthInitial(item.name) : item.name
          }));
          setData(processedData);
        } else {
          setData([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro desconhecido");
        console.error(`[2025-03-25 19:28:03] @sebastianascimento - Error fetching monthly data:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [companyId, status, isMobile]);

  const getMonthInitial = (monthName: string) => {
    return monthName.charAt(0);
  };

  if (status === "loading" || loading) {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error === "company_not_configured" || !companyId) {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h1 className="text-lg font-semibold">Monthly Orders</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] text-gray-500 p-3 sm:p-4">
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
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
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
    <div className="bg-white rounded-lg p-2 sm:p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1 sm:mb-4">
        <h1 className="text-base sm:text-lg font-semibold">
          Monthly Orders
          {companyName && (
            <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1 sm:ml-2">
              ({companyName})
            </span>
          )}
        </h1>
        <div className="sm:ml-auto ml-2">
          <Image 
            src="/moreDark.png" 
            alt="More options" 
            width={18} 
            height={18}
            className="cursor-pointer"
          />
        </div>
      </div>
      
      <div className="mt-0 flex-grow">
        {data.length > 0 ? (
          <div className="h-full flex items-center">
            <MonthlyOrderChart data={data} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No monthly order data available for your company
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyOrderChartContainer;