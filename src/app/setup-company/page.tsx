"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SetupCompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, update, status } = useSession();
  
  // Verificar se já tem uma empresa configurada
  useEffect(() => {
    if (session?.user?.companyId) {
      router.push("/dashboard");
    }
  }, [session, router]);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setError("Nome da empresa é obrigatório");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/company/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao configurar empresa");
      }
      
      // Atualiza a sessão e espera ela ser atualizada
      await update({
        ...session,
        user: {
          ...session?.user,
          companyId: data.companyId,
          companyName: data.companyName,
          hasCompany: true
        }
      });
      
      // Importante: Adicionar um pequeno atraso para permitir que a sessão seja atualizada
      setTimeout(() => {
        // Use o router.replace para substituir o histórico em vez de adicionar
        router.replace("/dashboard");
        // Force a página a recarregar para garantir que os dados da sessão estejam atualizados em toda parte
        router.refresh();
      }, 300);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Bem-vindo ao Sistema!</h1>
          <p className="text-sm text-gray-600 mt-2">
            Para continuar, configure sua empresa
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o nome da sua empresa"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? "Configurando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}