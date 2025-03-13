"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface OrderChartProps {
  data: Array<{
    name: string;
    orders: number;
  }>;
}

const OrderChart: React.FC<OrderChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} orders`, 'Total']} />
        <Bar dataKey="orders" fill="#8884d8" name="Total Orders" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OrderChart;