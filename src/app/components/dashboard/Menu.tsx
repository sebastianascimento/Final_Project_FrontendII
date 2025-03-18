"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

// Interface para itens do menu com tipo mais preciso
interface MenuItem {
  icon: string;
  label: string;
  href?: string;
  action?: string;
  visible: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
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
        icon: "/icons/logout.png",
        label: "Logout",
        href: "#", // Link fictício (corrige o erro de tipo)
        action: "logout", // Marcador especial para ação de logout
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = () => {
  const router = useRouter();
  const currentDate = "2025-03-15 13:25:51";
  const currentUser = "sebastianascimento";

  // Função para lidar com o logout
  const handleLogout = async () => {
    console.log(`[${currentDate}] @${currentUser} - Realizando logout da aplicação`);
    
    try {
      await signOut({ redirect: false });
      
      console.log(`[${currentDate}] @${currentUser} - Logout bem-sucedido, redirecionando para página inicial`);
      router.push("/");
    } catch (error) {
      console.error(`[${currentDate}] @${currentUser} - Erro ao realizar logout:`, error);
    }
  };

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          
          {section.items.map((item) => {
            // Se for item de logout, renderizar como botão
            if (item.action === "logout") {
              return (
                <button
                  key={item.label}
                  onClick={handleLogout}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight w-full text-left"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </button>
              );
            }
            
            // Outros itens renderizados como links
            return (
              <Link
                href={item.href || "#"} // Garantir que sempre há um href válido
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