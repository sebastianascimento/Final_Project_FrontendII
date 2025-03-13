"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LimparPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Limpar cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.trim().replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });
    
    // Redirecionar
    setTimeout(() => router.push("/login"), 1000);
  }, [router]);
  
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center p-8 bg-white shadow rounded">
        <h1 className="text-xl font-bold mb-2">Limpando sessão...</h1>
        <p>Você será redirecionado em instantes.</p>
      </div>
    </div>
  );
}