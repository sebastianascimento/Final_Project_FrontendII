"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

// Dados temporários com nomes de marcas reais
const TEMP_DATA: BrandSales[] = [
  { name: "Nike", sales: 45, color: "#FF6384" },
  { name: "Adidas", sales: 30, color: "#36A2EB" },
  { name: "Puma", sales: 25, color: "#FFCE56" },
  { name: "Reebok", sales: 15, color: "#4BC0C0" },
  { name: "New Balance", sales: 10, color: "#9966FF" },
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
  const [isUsingRealData, setIsUsingRealData] = useState(true);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  // Registrar data e usuário atuais com informações atualizadas
  const currentDate = "2025-03-12 12:45:26";
  const currentUser = "sebastianascimento";

  useEffect(() => {
    const fetchBrandSales = async () => {
      try {
        console.log(`Fetching brand sales data at ${currentDate} by ${currentUser}`);
        
        // Usar o caminho correto da API
        const response = await fetch('/api/orders/brands', {
          cache: 'no-store'
        }).catch(err => {
          console.error("API fetch failed:", err);
          return null;
        });
        
        if (!response || !response.ok) {
          console.warn(`API endpoint issue: ${response ? response.status : 'No response'}`);
          setIsUsingRealData(false);
          setApiStatus(`API endpoint not available. Using temporary data.`);
          setBrandsData(TEMP_DATA);
          return;
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        
        if (data.length === 0) {
          setApiStatus("API returned no data. Using temporary data.");
          setIsUsingRealData(false);
          setBrandsData(TEMP_DATA);
          return;
        }
        
        // Transformar os dados e adicionar cores
        const formattedData = data.map((brand, index) => ({
          name: brand.name,
          sales: brand.totalSales,
          color: BRAND_COLORS[index % BRAND_COLORS.length]
        }));
        
        console.log("Successfully loaded brand sales data:", formattedData);
        setIsUsingRealData(true);
        setBrandsData(formattedData);
      } catch (err) {
        console.error("Error processing brand sales data:", err);
        setApiStatus(err instanceof Error ? err.message : 'Unknown error');
        setIsUsingRealData(false);
        setBrandsData(TEMP_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandSales();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TÍTULO E LEGENDA */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-lg font-semibold">Sales by Brands</h1>
          {!isUsingRealData && apiStatus && (
            <p className="text-xs text-amber-600 mt-1 max-w-[250px]">
              {apiStatus}
            </p>
          )}
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