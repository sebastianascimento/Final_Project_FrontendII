"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

// Interface para tipagem dos dados da ordem
interface Order {
  id: number;
  date: string;
  total: number;
  status: string | null;
}

// Interface para tipagem dos dados mensais formatados
interface MonthData {
  name: string;
  income: number;
  expense: number;
}

const FinanceChart = () => {
  const currentDate = "2025-03-13 10:31:57";
  const currentUser = "sebastianascimento";

  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [dataFound, setDataFound] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching order finance data at ${currentDate} by ${currentUser}`);
        
        // Buscar dados das ordens da API específica para finanças
        const response = await fetch('/api/orders/finance');
        
        if (!response.ok) {
          throw new Error(`Error fetching order data: ${response.status}`);
        }
        
        const orders: Order[] = await response.json();
        
        if (orders && orders.length > 0) {
          // Processar os dados por mês
          const monthlyData = processOrdersByMonth(orders);
          
          // Calcular o total gasto
          const total = orders.reduce((sum, order) => sum + order.total, 0);
          
          setChartData(monthlyData);
          setTotalSpent(total);
          setDataFound(true);
          
          console.log(`Using order data: ${orders.length} orders found`);
        } else {
          // Se não há dados, não usar dados padrão, apenas mostrar a mensagem
          console.log("No order data found");
          setChartData([]);
          setTotalSpent(0);
          setDataFound(false);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDataFound(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, [currentDate, currentUser]);
  
  // Função para processar ordens por mês
  const processOrdersByMonth = (orders: Order[]): MonthData[] => {
    // Objeto para armazenar os totais por mês
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
    
    // Processar cada ordem e adicionar ao mês correspondente
    orders.forEach(order => {
      try {
        const date = new Date(order.date);
        if (!isNaN(date.getTime())) { // Verificar se a data é válida
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthNames[date.getMonth()];
          
          // Para este exemplo, consideramos todas as ordens como despesas
          monthlyTotals[monthName].expense += order.total;
          
          // Para dados de receita (simulação - não temos dados reais de receita)
          monthlyTotals[monthName].income += order.total * 1.2;
        }
      } catch (e) {
        console.error('Error processing order:', e);
      }
    });
    
    // Converter o objeto em um array para o gráfico
    return Object.keys(monthlyTotals).map(month => ({
      name: month,
      expense: monthlyTotals[month].expense,
      income: monthlyTotals[month].income
    }));
  };
  
  // Formatador de moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Mostrar loader enquanto os dados estão sendo carregados
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

  // Se não encontrou dados, mostrar mensagem
  if (!dataFound) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg font-semibold">Finance</h1>
          <Image src="/icons/investment.png" alt="Finance icon" width={20} height={20} />
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-gray-500 text-lg font-medium">Dados não encontrados</p>
          <p className="text-gray-400 text-sm text-center mt-1">
            Não há dados de ordens disponíveis para exibir no gráfico financeiro.
          </p>
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              Erro: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/icons/investment.png" alt="Finance icon" width={20} height={20} />
      </div>
      
      {/* Display Total Amount Spent */}
      <div className="mt-1 mb-4 bg-purple-50 rounded-lg p-3">
        <div className="text-sm text-gray-500">Total Amount Spent</div>
        <div className="text-xl font-bold text-purple-600">{formatCurrency(totalSpent)}</div>
      </div>
      
      {/* Observe a altura fixa aqui - importante para garantir que o gráfico seja visível */}
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
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
            <Tooltip />
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
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Dados atualizados em: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default FinanceChart;