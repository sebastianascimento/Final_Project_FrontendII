"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from "@/app/redux/hooks";
import { selectSearchTerm } from "@/app/redux/features/searchSlice";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const searchTerm = useAppSelector(selectSearchTerm);
  const [isReduxActive, setIsReduxActive] = useState(false);
  
  useEffect(() => {
    setIsReduxActive(true);
  }, []);

  return (
    <>
      {children}
      {isReduxActive && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-md text-xs z-50 opacity-70">
          Redux Active: {searchTerm ? `Search: "${searchTerm}"` : "No search term"}
        </div>
      )}
    </>
  );
}