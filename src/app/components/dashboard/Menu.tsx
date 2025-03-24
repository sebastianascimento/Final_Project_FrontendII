"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Menu as MenuIcon, X } from "lucide-react";

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
        href: "#",
        action: "logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
      </button>

      {/* Desktop menu */}
      <div className="hidden lg:block mt-4 text-sm">
        {menuItems.map((section) => (
          <div className="flex flex-col gap-2" key={section.title}>
            <span className="text-gray-400 font-light my-4">
              {section.title}
            </span>
            
            {section.items.map((item) => {
              if (item.action === "logout") {
                return (
                  <button
                    key={item.label}
                    onClick={handleLogout}
                    className="flex items-center justify-start gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight w-full text-left"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span>{item.label}</span>
                  </button>
                );
              }
              
              return (
                <Link
                  href={item.href || "#"}
                  key={item.label}
                  className="flex items-center justify-start gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile menu - hidden by default */}
      <div 
        ref={menuRef}
        className={`lg:hidden fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-xl transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="p-4 pt-16 text-sm">
          {menuItems.map((section) => (
            <div className="flex flex-col gap-2" key={section.title}>
              <span className="text-gray-400 font-light my-4">
                {section.title}
              </span>
              
              {section.items.map((item) => {
                if (item.action === "logout") {
                  return (
                    <button
                      key={item.label}
                      onClick={handleLogout}
                      className="flex items-center gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight w-full text-left"
                    >
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                
                return (
                  <Link
                    href={item.href || "#"}
                    key={item.label}
                    className="flex items-center gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Menu;