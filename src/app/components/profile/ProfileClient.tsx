"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import UserProfileCard from "@/app/components/profile/UserProfileCard";
import Menu from "@/app/components/dashboard/Menu";
import Navbar from "@/app/components/dashboard/Navbar";
import { Loader } from "lucide-react";

export default function ProfileClient() {
  const currentDate = "2025-03-24 12:14:08";
  const currentUser = "sebastianascimento";
  
  const { status } = useSession({ required: true });
  
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-live="polite" role="status">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" aria-hidden="true" />
          <p className="text-gray-500">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex">
      <nav className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4" aria-label="Menu Principal">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
          aria-label="Ir para página inicial"
        >
          <span className="hidden lg:block font-bold">BizControl</span>
        </Link>
        <Menu />
      </nav>

      <main className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4">
        <header>
          <Navbar />
        </header>

        <section className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Meu Perfil</h1>
          </header>
          
          <UserProfileCard editable={true} />
        </section>
      </main>
    </div>
  );
}