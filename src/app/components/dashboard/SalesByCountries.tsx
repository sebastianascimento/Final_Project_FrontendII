"use client";

import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "USA", sales: 20, color: "#FF6384" },
  { name: "UK", sales: 20, color: "#36A2EB" },
  { name: "Germany", sales: 20, color: "#FFCE56" },
  { name: "France", sales: 20, color: "#4BC0C0" },
  { name: "Japan", sales: 20, color: "#9966FF" },
];

const COLORS = data.map((item) => item.color);

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

const SalesByCountries = () => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TÍTULO E LEGENDA */}
      <div className="flex justify-between items-start">
        <h1 className="text-lg font-semibold">Sales by Countries</h1>
        <div className="flex flex-col items-end gap-2">
          {data.map((item, index) => (
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
              data={data}
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesByCountries;
