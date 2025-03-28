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
  
  const [inputValue, setInputValue] = useState(initialValue || reduxSearchTerm);
  
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    const valueToUse = initialValue || searchFromUrl || "";
    
    setInputValue(valueToUse);
    
    if (valueToUse !== reduxSearchTerm) {
      dispatch(setSearchTerm(valueToUse));
    }
  }, [initialValue]);
  
  const debouncedSearch = useMemo(() => 
    debounce((searchTerm: string) => {
      dispatch(setSearchTerm(searchTerm));
      dispatch(setIsSearching(false));
      
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 300) 
  , [dispatch, searchParams, pathname, router]);

 
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    setInputValue(newValue);
    
    dispatch(setIsSearching(true));
    
    debouncedSearch(newValue);
  }, [debouncedSearch, dispatch]);

  const handleClear = useCallback(() => {
    debouncedSearch.cancel();
    
    setInputValue("");
    
    dispatch(clearSearch());
    
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
        placeholder="Search"
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