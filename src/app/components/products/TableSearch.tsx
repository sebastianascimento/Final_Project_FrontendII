"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { 
  setSearchTerm, 
  selectSearchTerm, 
  setIsSearching,
  clearSearch
} from "@/app/redux/features/searchSlice";
import { debounce } from "lodash"; 

interface TableSearchProps {
  initialValue?: string;
}

const TableSearch = ({ initialValue = "" }: TableSearchProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dispatch = useAppDispatch();
  const reduxSearchTerm = useAppSelector(selectSearchTerm);
  
  // Local state only for input display
  const [inputValue, setInputValue] = useState(initialValue || reduxSearchTerm);
  
  // Initialize component with proper values
  useEffect(() => {
    // Only run on component mount or when initialValue changes
    const searchFromUrl = searchParams.get("search") || "";
    const valueToUse = initialValue || searchFromUrl || "";
    
    setInputValue(valueToUse);
    
    // Only dispatch if the value differs from redux
    if (valueToUse !== reduxSearchTerm) {
      dispatch(setSearchTerm(valueToUse));
    }
  }, [initialValue]); // No redux or searchParams dependency
  
  // Create debounced function ONCE with useCallback + useMemo
  const debouncedSearch = useMemo(() => 
    debounce((searchTerm: string) => {
      // Update Redux only AFTER the debounce
      dispatch(setSearchTerm(searchTerm));
      dispatch(setIsSearching(false));
      
      // Update URL params
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 300) // Reduced from 500ms to 300ms for faster response
  , [dispatch, searchParams, pathname, router]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only update local state immediately (for UI responsiveness)
    setInputValue(newValue);
    
    // Show loading state while debounce is in progress
    dispatch(setIsSearching(true));
    
    // Debounce the expensive operations
    debouncedSearch(newValue);
  }, [debouncedSearch, dispatch]);

  const handleClear = useCallback(() => {
    // Cancel any pending debounced operations
    debouncedSearch.cancel();
    
    // Update local state immediately
    setInputValue("");
    
    // Update Redux directly for clear action
    dispatch(clearSearch());
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, dispatch, searchParams, pathname, router]);

  return (
    <div className="relative flex items-center w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-gray-500" />
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleSearch}
        className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search products..."
      />
      
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TableSearch;