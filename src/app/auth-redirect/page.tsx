"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirecionando... | BizControl',
  description: 'Aguarde enquanto te direcionamos para a página correta.',
  robots: 'noindex, nofollow', 
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Redirecionando | BizControl',
    description: 'Sistema de gerenciamento empresarial',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BizControl Logo',
      },
    ],
    siteName: 'BizControl',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Redirecionando | BizControl',
    description: 'Sistema de gerenciamento empresarial',
    images: ['/images/twitter-image.jpg'],
  },
};

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("Verificando suas informações...");
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    
    const hasCompany = session?.user?.hasCompany || session?.user?.companyId;
    
    if (!hasCompany) {
      setMessage("Configurando sua conta...");
      router.push("/setup-company");
    } else {
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