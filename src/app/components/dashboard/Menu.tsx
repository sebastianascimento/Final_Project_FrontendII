import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/icons/home.png",
        label: "Home",
        href: "/dashboard",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/icons/products.png",
        label: "Products",
        href: "/list/products",
        visible: ["admin", "teacher"],
      },      
      {
        icon: "/icons/orders.png",
        label: "Orders",
        href: "/list/orders",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/icons/clients.png",
        label: "Clients",
        href: "/list/clients",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/icons/logistic.png",
        label: "Logistics",
        href: "/list/logistics",
        visible: ["admin"],
      },
      {
        icon: "/icons/movestock.png",
        label: "Stocks",
        href: "/list/stocks",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/icons/statistic.png",
        label: "Statistic",
        href: "/list/statistic",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/icons/calender.png",
        label: "Calendar",
        href: "/list/calendar",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/icons/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/icons/settings.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/icons/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;