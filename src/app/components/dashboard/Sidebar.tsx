import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-white border-r border-gray-200">
      <Link href="/" className="flex items-center justify-center lg:justify-start gap-2">
        <span className="hidden lg:block font-bold text-lg text-gray-700">BizControl</span>
      </Link>
    </div>
  );
};

export default Sidebar;
