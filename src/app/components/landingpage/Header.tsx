"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="flex justify-center py-3 px-4 w-full">
      <div
        className="flex items-center justify-between px-4 py-2 w-full max-w-5xl shadow-lg backdrop-blur-lg rounded-[16px]"
        style={{ backgroundColor: "rgb(59 130 246 / 0.95)" }}
      >
        <div className="flex items-center">
          <img
            src="/icons/bizcontrol.png"
            className="h-14 md:h-16 w-auto transform scale-125 -translate-y-1"
            alt="BizControl Logo"
          />
        </div>

        {/* Sign In centralizado */}
        <div className="flex-1 flex justify-center">
          {!session ? (
            <Link
              href="/signin"
              className="px-8 py-2 rounded-full text-white hover:bg-blue-600 text-center"
            >
              Sign in
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="px-8 py-2 rounded-full text-white hover:bg-blue-600 text-center"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Área para botão de Sign Out quando logado (desktop) */}
        <div className="hidden md:block">
          {session && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full text-white hover:bg-red-500"
            >
              Sign out
            </button>
          )}
          {/* Espaço vazio quando não logado para manter o layout balanceado */}
          {!session && <div className="w-[88px]"></div>}
        </div>

        {/* Botão de Hamburger para Mobile */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {!isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Mobile - Simplificado */}
      {isMenuOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-blue-500 shadow-lg rounded-b-lg z-50 px-4 py-2 flex flex-col md:hidden transition-all duration-300 ease-in-out">
          <Link
            href="/"
            className="py-3 text-white border-b border-blue-400 hover:bg-blue-600 px-4"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {session && (
            <>
              <Link
                href="/dashboard"
                className="py-3 text-white border-b border-blue-400 hover:bg-blue-600 px-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="py-3 text-white hover:bg-red-500 text-left px-4"
              >
                Sign out
              </button>
            </>
          )}
          {!session && (
            <Link
              href="/signin"
              className="py-3 text-white hover:bg-blue-600 px-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;