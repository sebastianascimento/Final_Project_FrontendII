import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../components/dashboard/Menu";
import Navbar from "../components/dashboard/Navbar";
import UserCard from "../components/dashboard/UserCard";
import OrderChart from "../components/dashboard/OrderChart";
import FinanceChart from "../components/dashboard/FinanceChart";
import OrderChartContainer from "../components/dashboard/OrderChartContainer";
import SalesByBrands from "../components/dashboard/SalesByBrands";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
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

        {/* USER CARDS - Ocupando 100% da largura */}
        <div className="w-full flex gap-4 flex-wrap justify-start mb-4">
          <UserCard type="products" />
          <UserCard type="orders" />
          <UserCard type="customers" />
        </div>

        {/* ATTENDANCE E BEST SELLER PRODUCTS - Lado a lado, 50% cada */}
        <div className="flex flex-wrap gap-4 mt-4 w-full justify-start">
          <div className="w-1/2 h-[500px] w-[2000px]">
            <OrderChartContainer />
          </div>
        </div>

        {/* SALES BY COUNTRIES - 100% da largura */}
        <div className="w-full h-[450px] mt-4">
          <SalesByBrands />
        </div>

        {/* FINANCE CHART - Ocupa 100% da largura */}
        <div className="w-full h-[500px] mt-4">
          <FinanceChart />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
