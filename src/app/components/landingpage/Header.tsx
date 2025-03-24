"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="flex justify-center py-6">
      <div
        className="flex items-center justify-between px-6 py-2 w-[90%] max-w-5xl shadow-lg backdrop-blur-lg rounded-[16px]"
        style={{ backgroundColor: "rgb(59 130 246 / 0.95)" }}
      >
        {/* Navegação Esquerda */}
        <nav className="flex space-x-4">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-white hover:bg-blue-600"
          >
            Home
          </Link>
          <Link
            href="/blogs"
            className="px-4 py-2 rounded-full text-white hover:bg-blue-600"
          >
            Blogs
          </Link>
          {!session ? (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-full text-white hover:bg-blue-600"
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full text-white hover:bg-red-500"
            >
              Sign out
            </button>
          )}
        </nav>

        {/* Logo Central */}
        <div className="text-lg font-bold text-white mx-auto">
          <img
            src="/icons/bizcontrol.png"
            className="h-16 w-auto" 
            alt="BizControl Logo"
          />
        </div>

        {/* Botão Direito */}
        <button className="px-6 py-2 rounded-full bg-white text-blue-500 hover:bg-blue-50 transition-colors duration-200">
          Contact
        </button>
      </div>
    </header>
  );
};

export default Header;
