"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { deleteProduct } from "@/app/lib/actions";

// Definindo tipos
interface Product {
  id: string | number;
  name: string;
  price: number;
  description?: string | null;
  img?: string | null;
  categoryId?: number | null;
  brandId?: number | null;
  supplierId?: number | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  supplier?: { name: string } | null;
}

interface CurrentState {
  success: boolean;
  error: boolean;
  message?: string;
}

// Componente com tipos explícitos
export default function ProductActions({ product }: { product: Product }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const handleEdit = () => {
    router.push(`/products/edit/${product.id}`);
  };
  
  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", product.id.toString());
      
      // Passar CurrentState inicial correto
      const initialState: CurrentState = { success: false, error: false };
      const result = await deleteProduct(initialState, formData);
      
      if (result.success) {
        toast.success("Produto excluído com sucesso!");
        router.refresh();
      } else {
        throw new Error(result.message || "Erro ao excluir produto");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir produto");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex justify-end space-x-2">
      <button
        onClick={handleEdit}
        className="px-3 py-1 text-xs rounded bg-yellow-500 text-white"
        disabled={isDeleting}
      >
        Editar
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-1 text-xs rounded bg-red-500 text-white"
        disabled={isDeleting}
      >
        {isDeleting ? "..." : "Excluir"}
      </button>
    </div>
  );
}