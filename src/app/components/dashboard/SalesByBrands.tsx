"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useSession } from "next-auth/react";
import { Building, RefreshCw } from "lucide-react";

interface BrandSales {
  name: string;
  sales: number;
  color: string;
}

// Cores distintas para o gráfico
const BRAND_COLORS = [
  "#FF6384", // vermelho
  "#36A2EB", // azul
  "#FFCE56", // amarelo
  "#4BC0C0", // verde água
  "#9966FF", // roxo
  "#FF9F40", // laranja
  "#8AC54F", // verde
  "#EA80FC", // rosa
  "#00E5FF", // ciano
  "#FF5252", // vermelho claro
];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#333"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SalesByBrands = () => {
  const [brandsData, setBrandsData] = useState<BrandSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // MULTI-TENANT: Obter dados da sessão
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  // Informações atualizadas conforme solicitado
  const currentDate = "2025-03-15 09:51:16";
  const currentUser = "sebastianascimento";

  // Função para buscar dados
  const fetchBrandSales = async () => {
    try {
      setLoading(true);
      setError(null);

      // MULTI-TENANT: Verificar se há empresa configurada
      if (status !== "loading" && !companyId) {
        console.log(`[${currentDate}] @${currentUser} - Tentando acessar dados sem empresa configurada`);
        setError("company_not_configured");
        setLoading(false);
        return;
      }

      // Aguardar carregamento da sessão
      if (status === "loading") {
        return;
      }
      
      // MULTI-TENANT: Adicionar companyId à consulta
      console.log(`[${currentDate}] @${currentUser} - Buscando vendas por marca para empresa: ${companyId}`);
      
      // Usar o caminho correto da API com parâmetro de companyId
      const response = await fetch(`/api/orders/brands?companyId=${companyId}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error(`[${currentDate}] @${currentUser} - Erro da API: ${response.status}`);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      // MULTI-TENANT: Verificar se há dados para esta empresa específica
      if (data.length === 0) {
        console.log(`[${currentDate}] @${currentUser} - Nenhum dado de vendas encontrado para empresa ${companyId}`);
        setError("no_data");
        setBrandsData([]);
        return;
      }
      
      // Transformar os dados e adicionar cores
      const formattedData = data.map((brand, index) => ({
        name: brand.name,
        sales: brand.totalSales,
        color: BRAND_COLORS[index % BRAND_COLORS.length]
      }));
      
      console.log(`[${currentDate}] @${currentUser} - Carregou ${formattedData.length} marcas para empresa ${companyId}`);
      setBrandsData(formattedData);
    } catch (err) {
      console.error(`[${currentDate}] @${currentUser} - Erro ao processar dados:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBrandsData([]); // Não usar dados falsos
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchBrandSales();
    }
  }, [companyId, status]);

  // MULTI-TENANT: Tratar carregamento da sessão
  if (status === 'loading') {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Carregando informações de usuário...</span>
      </div>
    );
  }

  // MULTI-TENANT: Mostrar mensagem quando não há empresa configurada
  if (error === "company_not_configured" || (!loading && !companyId)) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <h1 className="text-lg font-semibold mb-4">Sales by Brands</h1>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] p-4">
          <Building size={32} className="text-amber-500 mb-3" />
          <h3 className="text-gray-800 font-medium mb-2">Empresa não configurada</h3>
          <p className="text-gray-600 text-center text-sm mb-4">
            Para visualizar as vendas por marca, configure sua empresa primeiro.
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

  // Mostrar loader durante carregamento
  if (loading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mostrar mensagem quando não há dados (em vez de dados falsos)
  if (error === "no_data" || brandsData.length === 0) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold flex items-center">
            Sales by Brands
            {companyName && (
              <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
            )}
          </h1>
          <button 
            onClick={fetchBrandSales} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-gray-700 font-medium mb-1">Nenhum dado encontrado</h3>
          <p className="text-gray-500 text-center text-sm">
            Não existem dados de vendas por marca para sua empresa.
          </p>
          <button 
            onClick={fetchBrandSales}
            className="mt-4 px-3 py-1.5 bg-blue-500 text-white text-sm rounded flex items-center hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Atualizar
          </button>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de erro geral
  if (error && error !== "no_data" && error !== "company_not_configured") {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">Sales by Brands</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-gray-700 font-medium mb-1">Erro ao carregar dados</h3>
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button 
            onClick={fetchBrandSales}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded flex items-center hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TÍTULO E LEGENDA */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-lg font-semibold flex items-center">
            Sales by Brands
            {/* MULTI-TENANT: Mostrar nome da empresa */}
            {companyName && (
              <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
            )}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          {brandsData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <h2 className="text-sm text-gray-600 font-semibold">{item.name}</h2>
            </div>
          ))}
        </div>
      </div>
      
      {/* GRÁFICO */}
      <div className="relative w-full h-[75%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={brandsData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="80%"
              fill="#8884d8"
              paddingAngle={5}
              dataKey="sales"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {brandsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesByBrands;