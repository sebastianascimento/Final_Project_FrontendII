"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { debounce } from "lodash";

export default function ProductsFilter({ initialSearch = "" }) {
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Função para atualizar URL com debounce
  const updateSearch = debounce((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    // Sempre voltar à página 1 quando buscar
    params.set("page", "1");
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    updateSearch(value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar produtos..."
        className="px-4 py-2 pr-10 border rounded-lg w-64"
        value={search}
        onChange={handleSearchChange}
      />
      <div className="absolute right-3 top-2 text-gray-400">
        {isPending ? (
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
        ) : (
          <span>🔍</span>
        )}
      </div>
    </div>
  );
}