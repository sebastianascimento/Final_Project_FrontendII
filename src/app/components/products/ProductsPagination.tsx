"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function ProductsPagination({ 
  currentPage, 
  totalPages,
  totalItems 
}: ProductsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Função para navegar para uma página específica
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };
  
  // Determinar quais páginas mostrar
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Mostrar todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas ao redor da atual
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
  
  // Se não houver páginas, não renderizar nada
  if (totalPages <= 1) {
    return null;
  }
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-4 space-y-3 md:space-y-0">
      <p className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{Math.min(currentPage * 10 - 9, totalItems)}</span> a{" "}
        <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> de{" "}
        <span className="font-medium">{totalItems}</span> produtos
      </p>
      
      <div className="flex space-x-1">
        <button
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded ${
            currentPage <= 1 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          &lt;
        </button>
        
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-blue-500 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 rounded ${
            currentPage >= totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}