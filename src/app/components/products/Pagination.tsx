"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { setCurrentPage, selectCurrentPage } from "@/app/redux/features/searchSlice";
import { ITEM_PER_PAGE } from "@/app/lib/setting";

interface PaginationProps {
  count: number;
  page?: number; // Make it optional so we don't break existing usage
}

const Pagination = ({ count, page }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dispatch = useAppDispatch();
  const reduxCurrentPage = useAppSelector(selectCurrentPage);
  
  // Use the page prop if provided, otherwise use Redux state
  const currentPage = page !== undefined ? page : reduxCurrentPage;
  
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * ITEM_PER_PAGE < count;

  // Calculate total pages
  const totalPages = Math.ceil(count / ITEM_PER_PAGE);

  useEffect(() => {
    // If page prop is provided, sync it to Redux
    if (page !== undefined && page !== reduxCurrentPage) {
      dispatch(setCurrentPage(page));
      return;
    }
    
    // Otherwise sync from URL on component mount
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    if (pageFromUrl !== reduxCurrentPage) {
      dispatch(setCurrentPage(pageFromUrl));
    }
  }, [searchParams, dispatch, reduxCurrentPage, page]);

  const handlePageChange = (newPage: number) => {
    dispatch(setCurrentPage(newPage));
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (count <= ITEM_PER_PAGE) return null;

  return (
    <div className="flex justify-between items-center mt-4 px-4">
      <button
        disabled={!hasPrev}
        onClick={() => handlePageChange(currentPage - 1)}
        className={`px-3 py-1 rounded ${
          hasPrev
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        Previous
      </button>
      
      <div className="flex gap-1">
        {getPageNumbers().map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-3 py-1 rounded ${
              currentPage === pageNum
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      <button
        disabled={!hasNext}
        onClick={() => handlePageChange(currentPage + 1)}
        className={`px-3 py-1 rounded ${
          hasNext
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;