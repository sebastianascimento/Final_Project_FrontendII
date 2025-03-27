import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../components/dashboard/Menu";
import Navbar from "../components/dashboard/Navbar";
import UserCard from "../components/dashboard/UserCard";
import OrderChartContainer from "../components/dashboard/OrderChartContainer";
import SalesByBrands from "../components/dashboard/SalesByBrands";
import FinanceChart from "../components/dashboard/FinanceChart";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | BizControl - Sistema de Gestão de Produtos",
  description:
    "Painel de controle para gestão de produtos, pedidos e clientes da sua empresa.",
  keywords: [
    "dashboard",
    "gestão empresarial",
    "analytics",
    "produtos",
    "pedidos",
    "clientes",
  ],
  openGraph: {
    title: "Dashboard BizControl",
    description: "Painel administrativo para gestão empresarial completa",
    url: "https://bizcontrol.com/dashboard",
    siteName: "BizControl",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  const jsonLdScript = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BizControl Dashboard",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdScript) }}
      />
      <div className="h-screen flex">
        <div className="hidden lg:block w-[16%] xl:w-[14%] p-4">
          <Link href="/" className="flex items-center justify-start gap-2">
            <span className="font-bold">BizControl</span>
          </Link>
          <Menu />
        </div>
        <div className="lg:hidden">
          <Menu />
        </div>
        <div className="w-full lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col p-3 sm:p-4 pt-12 sm:pt-6">
          <Navbar />
          <div className="h-8 sm:h-16"></div>
          <div className="w-full flex gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start mb-4 mt-8 sm:mt-12">
            <UserCard type="products" />
            <UserCard type="orders" />
            <UserCard type="customers" />
          </div>
          
          <div className="w-full mt-6 sm:mt-8">
            <div className="w-full h-[500px] sm:h-[600px] md:h-[650px] lg:h-[500px]">
              <OrderChartContainer />
            </div>
          </div>
          
          <div className="w-full h-[350px] sm:h-[450px] mt-6 sm:mt-8">
            <SalesByBrands />
          </div>
          <div className="w-full h-[400px] sm:h-[500px] mt-6 sm:mt-8 mb-6 sm:mb-8">
            <FinanceChart />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;