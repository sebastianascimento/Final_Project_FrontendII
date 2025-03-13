import { getServerSession } from 'next-auth'; // Import necessary session logic
import BigCalendar from "../../components/calendar/BigCalendar";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import Link from 'next/link';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


const CalendarPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  return (
    <div className="h-screen flex">
      {/* LEFT - Sidebar (same as in the ProductsPage) */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
        >
          <span className="hidden lg:block font-bold">BizControl</span>
        </Link>
        <Menu />
      </div>

      {/* RIGHT - Main Content */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4">
        <Navbar />
        <div className="m-4 bg-white p-4 rounded-md shadow-lg">
          <BigCalendar />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
