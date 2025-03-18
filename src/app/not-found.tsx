"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const { status } = useSession();
  const router = useRouter();
  
  const currentDate = "2025-03-15 15:46:07";
  const currentUser = "sebastianascimento";

  useEffect(() => {
    if (status === "loading") return;
    
    // Definir o tempo para redirecionamento
    const timeout = setTimeout(() => {
      if (status === "authenticated") {
        console.log(`[${currentDate}] @${currentUser} - Usuário autenticado encontrou página 404, redirecionando para /dashboard`);
        router.push('/dashboard');
      } else {
        console.log(`[${currentDate}] @${currentUser} - Usuário não autenticado encontrou página 404, redirecionando para página inicial`);
        router.push('/');
      }
    }); 
    
    // Limpar timeout se componente desmontar
    return () => clearTimeout(timeout);
  }, [status, router, currentDate, currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página não encontrada</h2>
        <p className="text-gray-500 mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        {/* Mensagem de redirecionamento baseado no status */}
        <div className="mt-8 text-sm text-gray-500">
          {status === "loading" ? (
            <p>Verificando informações...</p>
          ) : status === "authenticated" ? (
            <p>Redirecionando para o Dashboard em alguns segundos...</p>
          ) : (
            <p>Redirecionando para a página inicial em alguns segundos...</p>
          )}
          
          <div className="mt-3 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-1 animate-progress"></div>
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-400">
          <p>Data: {currentDate}</p>
          <p>Usuário: {currentUser}</p>
        </div>
      </div>
    </div>
  );
}