"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyOrderChartProps {
  data: Array<{
    name: string; // formato "Mês Ano" (ex: "Jan 2025")
    orders: number;
  }>;
}

const MonthlyOrderChart: React.FC<MonthlyOrderChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} orders`, 'Monthly Total']} />
        <Bar dataKey="orders" fill="#82ca9d" name="Monthly Orders" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyOrderChart;