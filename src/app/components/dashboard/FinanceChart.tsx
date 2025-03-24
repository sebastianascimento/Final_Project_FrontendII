"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Building, RefreshCw } from "lucide-react";

interface Order {
  id: number;
  date: string;
  total: number;
  status: string | null;
}

interface MonthData {
  name: string;
  income: number;
  expense: number;
}

const FinanceChart = () => {
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [dataFound, setDataFound] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);

      if (status !== "loading" && !companyId) {
        setError("company_not_configured");
        setIsLoading(false);
        return;
      }

      if (status === "loading") {
        return;
      }
      
      const response = await fetch(`/api/orders/finance?companyId=${companyId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching order data: ${response.status}`);
      }
      
      const orders: Order[] = await response.json();
      
      if (orders && orders.length > 0) {
        const monthlyData = processOrdersByMonth(orders);
        
        const total = orders.reduce((sum, order) => sum + order.total, 0);
        
        setChartData(monthlyData);
        setTotalSpent(total);
        setDataFound(true);
        
      } else {
        setChartData([]);
        setTotalSpent(0);
        setDataFound(false);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDataFound(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (status !== 'loading') {
      fetchFinanceData();
    }
  }, [companyId, status]);
  
  const processOrdersByMonth = (orders: Order[]): MonthData[] => {
    const monthlyTotals: Record<string, {income: number, expense: number}> = {
      'Jan': {income: 0, expense: 0},
      'Feb': {income: 0, expense: 0},
      'Mar': {income: 0, expense: 0},
      'Apr': {income: 0, expense: 0},
      'May': {income: 0, expense: 0},
      'Jun': {income: 0, expense: 0},
      'Jul': {income: 0, expense: 0},
      'Aug': {income: 0, expense: 0},
      'Sep': {income: 0, expense: 0},
      'Oct': {income: 0, expense: 0},
      'Nov': {income: 0, expense: 0},
      'Dec': {income: 0, expense: 0},
    };
    
    orders.forEach(order => {
      try {
        const date = new Date(order.date);
        if (!isNaN(date.getTime())) { 
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthNames[date.getMonth()];
          
          monthlyTotals[monthName].expense += order.total;
          
          monthlyTotals[monthName].income += order.total * 1.2;
        }
      } catch (e) {
      }
    });
    
    return Object.keys(monthlyTotals).map(month => ({
      name: month,
      expense: monthlyTotals[month].expense,
      income: monthlyTotals[month].income
    }));
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProcessedChartData = () => {
    if (isMobile) {
      return chartData.map(item => ({
        ...item,
        name: item.name.charAt(0)
      }));
    }
    return chartData;
  };
  
  if (status === 'loading') {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">Carregando informações de usuário...</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (!dataFound) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg font-semibold flex items-center">
            Finance
            {companyName && (
              <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchFinanceData} 
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <Image src="/icons/investment.png" alt="Finance icon" width={20} height={20} />
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          <p className="text-gray-500 text-lg font-medium">Dados não encontrados</p>
          <p className="text-gray-400 text-sm text-center mt-1">
            Não há dados financeiros disponíveis para sua empresa.
          </p>
          {error && error !== "company_not_configured" && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              Erro: {error}
            </div>
          )}
          <button 
            onClick={fetchFinanceData}
            className="mt-4 px-3 py-1.5 bg-blue-500 text-white text-sm rounded flex items-center hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const processedData = getProcessedChartData();

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-semibold flex items-center">
          Finance
          {companyName && (
            <span className="ml-2 text-sm font-normal text-gray-500 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
              ({companyName})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchFinanceData} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          <Image src="/icons/investment.png" alt="Finance icon" width={20} height={20} />
        </div>
      </div>
      
      <div className="mt-1 mb-4 bg-purple-50 rounded-lg p-3">
        <div className="text-sm text-gray-500">Total Amount Spent</div>
        <div className="text-xl font-bold text-purple-600">{formatCurrency(totalSpent)}</div>
      </div>
      
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#d1d5db" }}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis 
              axisLine={false} 
              tick={{ fill: "#d1d5db" }} 
              tickLine={false} 
              tickMargin={20}
            />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#C3EBFA"
              strokeWidth={5}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              name="Expense" 
              stroke="#CFCEFF" 
              strokeWidth={5}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;