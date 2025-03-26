"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "./components/landingpage/Header";
import Hero from "./components/landingpage/Hero";
import Features from "./components/landingpage/Features";
import Footer from "./components/landingpage/Footer";

export default function HomeClient() {
  const { status } = useSession();
  const router = useRouter();
  

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
  
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white text-black">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}