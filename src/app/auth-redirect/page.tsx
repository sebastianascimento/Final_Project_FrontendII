// [2025-03-14 11:34:47] @sebastianascimento - Página de redirecionamento após autenticação
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("Verificando suas informações...");
  
  useEffect(() => {
    if (status === "loading") return;
    
    // Se não estiver autenticado, redirecionar para login
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    
    // Verificar se tem empresa associada
    const hasCompany = session?.user?.hasCompany || session?.user?.companyId;
    
    if (!hasCompany) {
      console.log("[2025-03-14 11:34:47] @sebastianascimento - Redirecionando para configuração de empresa");
      setMessage("Configurando sua conta...");
      router.push("/setup-company");
    } else {
      console.log("[2025-03-14 11:34:47] @sebastianascimento - Redirecionando para dashboard");
      setMessage("Entrando no sistema...");
      router.push("/dashboard");
    }
  }, [session, status, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-gray-500 mt-2">Por favor, aguarde...</p>
      </div>
    </div>
  );
}