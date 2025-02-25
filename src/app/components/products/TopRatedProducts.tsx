"use client"

import { useState } from 'react';
import React from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  rating: number;
  status: 'In Stock' | 'Out of Stock';
  link: string;
}

export default function TopRatedProducts() {
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);

  // Dados de exemplo - substitua com seus dados reais
  const products: Product[] = [
    { id: 1, name: 'Smart Watch', price: '$299', rating: 4.8, status: 'In Stock', link: '#' },
    { id: 2, name: 'Wireless Headphones', price: '$199', rating: 4.5, status: 'Out of Stock', link: '#' },
    { id: 3, name: 'Bluetooth Speaker', price: '$149', rating: 4.2, status: 'In Stock', link: '#' },
    // Adicione mais produtos conforme necessário
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-white">Top Rated Products</h3>
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2.5"
        >
          <option value="rating">Sort by Rating</option>
          <option value="price">Sort by Price</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 border-b">
              <th className="pb-3">Product Name</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Rating</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3">
                  <a href={product.link} className="text-gray-700 dark:text-white hover:text-blue-600">
                    {product.name}
                  </a>
                </td>
                <td className="py-3 text-gray-600 dark:text-gray-300">{product.price}</td>
                <td className="py-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-gray-600 dark:text-gray-300">{product.rating}</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    product.status === 'In Stock' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-end items-center mt-6 space-x-3">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-gray-600 dark:text-gray-300">Page {currentPage}</span>
        <button 
          onClick={() => setCurrentPage(p => p + 1)}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}