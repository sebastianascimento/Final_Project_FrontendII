import { Metadata } from "next";
import LoginClient from "../components/sigin/login-client";
import Image from "next/image"; 

export const metadata: Metadata = {
  title: "Login | BizControl",
  description: "Faça login para acessar o sistema e gerenciar sua conta",
  robots: "index, follow",
  openGraph: {
    title: "Login | BizControl",
    description: "Faça login para acessar o sistema e gerenciar sua conta",
    type: "website",
    images: [
      {
        url: "/icons/bizcontrol.png", 
        width: 1200,
        height: 630,
        alt: "Logo BizControl",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | BizControl",
    description: "Faça login para acessar o sistema e gerenciar sua conta",
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Image 
            src="/icons/bizcontrol.png"
            alt="Logo BizControl" 
            width={120}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="mt-2 text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>
        
        <LoginClient />
      </div>
    </div>
  );
}