"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import UserProfileCard from "@/app/components/profile/UserProfileCard";
import Menu from "@/app/components/dashboard/Menu";
import Navbar from "@/app/components/dashboard/Navbar";
import { Loader } from "lucide-react";

export default function ProfilePage() {
  // Data e usuário atualizados conforme solicitado
  const currentDate = "2025-03-15 11:41:58";
  const currentUser = "sebastianascimento";
  
  const { status } = useSession({ required: true });
  
  // Renderizar loader enquanto a sessão está carregando
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex">
      {/* LEFT - Sidebar */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
        >
          <span className="hidden lg:block font-bold">BizControl</span>
        </Link>
        <Menu />
      </div>

      {/* RIGHT - Main content */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4">
        <Navbar />

        <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Meu Perfil</h1>
          </div>
          
          {/* Card de Perfil do Usuário */}
          <UserProfileCard editable={true} />
          
          {/* Rodapé da página de perfil */}
          <footer className="mt-8 text-xs text-gray-500 text-right">
            <p>Última atualização: {currentDate}</p>
            <p>Usuário: {currentUser}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}