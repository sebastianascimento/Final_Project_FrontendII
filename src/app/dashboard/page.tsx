import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../components/dashboard/Menu";
import Navbar from "../components/dashboard/Navbar";
import UserCard from "../components/dashboard/UserCard";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import FinanceChart from "../components/dashboard/FinanceChart";
import SalesByCountries from "../components/dashboard/SalesByCountries";

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
          <UserCard type="Sales" icon="/icons/sales.png"/>
          <UserCard type="Revenue" icon="/icons/revenue.png" />
          <UserCard type="Product Sold" icon="/icons/stock.png" />
          <UserCard type="New Customers" icon="/icons/new.png"/>
        </div>

        {/* ATTENDANCE E BEST SELLER PRODUCTS - Lado a lado, 50% cada */}
        <div className="flex flex-wrap gap-4 mt-4 w-full justify-start">
          <div className="w-1/2 h-[500px] w-[2000px]">
            <AttendanceChart />
          </div>
        </div>

        {/* SALES BY COUNTRIES - 100% da largura */}
        <div className="w-full h-[450px] mt-4">
          <SalesByCountries />
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
