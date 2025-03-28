"use client";

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import OrderChart from "./OrderChart";
import { useSession } from "next-auth/react";
import { Building } from "lucide-react";

interface ProcessedData {
  name: string;
  orders: number;
}

const OrderChartContainer = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (status !== "loading" && !companyId) {
          setError("company_not_configured");
          setLoading(false);
          return;
        }

        if (status === "loading") {
          return;
        }
        
        const response = await fetch(`/api/orders/weekly-stats?companyId=${companyId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order data: ${response.statusText}`);
        }
        
        const resData = await response.json();
        if (Array.isArray(resData)) {
          setData(resData);
        } else {
          setData([]);
          setError("invalid_data_format");
        }
      } catch (error) {
        setData([]);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, status]);

  if (status === "loading") {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full flex items-center justify-center">
        <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm sm:text-base text-gray-600">Carregando informações de usuário...</span>
      </div>
    );
  }

  if (error === "company_not_configured" || (!loading && !companyId)) {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h1 className="text-base sm:text-lg font-semibold">Orders of the week</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-32px)] sm:h-[calc(100%-40px)] p-2 sm:p-4">
          <Building size={24} className="text-amber-500 mb-2 sm:mb-3" />
          <h3 className="text-gray-800 font-medium text-sm sm:text-base mb-1 sm:mb-2">Empresa não configurada</h3>
          <p className="text-gray-600 text-center text-xs sm:text-sm mb-3 sm:mb-4">
            Para visualizar os pedidos da semana, configure sua empresa primeiro.
          </p>
          <a 
            href="/setup-company" 
            className="px-2 sm:px-3 py-1 bg-blue-500 text-white text-xs sm:text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Configurar Empresa
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full flex items-center justify-center">
        <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && error !== "company_not_configured") {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 h-full">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h1 className="text-base sm:text-lg font-semibold">Orders of the week</h1>
        </div>
        
        <div className="flex items-center justify-center h-[calc(100%-32px)] sm:h-[calc(100%-40px)]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 mb-2 sm:mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-sm sm:text-base">Erro ao carregar dados</p>
            <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const processedData = isMobile 
    ? data.map(item => ({
        name: item.name.charAt(0),
        orders: item.orders
      }))
    : data;

  return (
    <div className="bg-white rounded-lg p-3 sm:p-5 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 sm:mb-4">
        <h1 className="text-base sm:text-lg font-semibold flex items-center">
          Orders of the week
          {companyName && (
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-normal text-gray-500 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
              ({companyName})
            </span>
          )}
        </h1>
      </div>
      
      <div className="pt-12 sm:pt-0 mt-4 sm:mt-0 flex-grow w-full h-full min-h-[200px] md:min-h-[300px] lg:min-h-[350px]">
        {data.length > 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-full h-full md:w-[95%] md:h-[85%] lg:w-[90%] lg:h-[80%]">
              <OrderChart data={processedData} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-xs sm:text-sm md:text-base text-gray-500">
            No orders data available for your company
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderChartContainer;