"use client";

import React from 'react';
import Image from "next/image";
import MonthlyOrderChart from "./MonthlyOrderChart";

interface MonthlyData {
  name: string;
  orders: number;
}

const MonthlyOrderChartContainer = () => {
  const [data, setData] = React.useState<MonthlyData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/orders/monthly-stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly order data`);
        }
        
        const resData = await response.json();
        if (Array.isArray(resData)) {
          setData(resData);
        } else {
          console.error("Invalid data format received");
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching monthly data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">Monthly Orders</h1>
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
          No monthly order data available
        </div>
      )}
    </div>
  );
};

export default MonthlyOrderChartContainer;