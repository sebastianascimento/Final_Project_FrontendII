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
        className="flex items-center justify-between px-6 py-6 w-[90%] max-w-5xl shadow-lg backdrop-blur-lg rounded-[16px]"
        style={{ backgroundColor: "rgba(13, 13, 13, 0.85)" }} 
      >
        {/* Navegação Esquerda */}
        <nav className="flex space-x-4">
          <Link href="/" className="px-4 py-2 rounded-full text-white hover:bg-gray-700">
            Home
          </Link>
          <Link href="/blogs" className="px-4 py-2 rounded-full text-white hover:bg-gray-700">
            Blogs
          </Link>
          {!session ? (
            <Link href="/signin" className="px-4 py-2 rounded-full text-white hover:bg-gray-700">
              Sign in
            </Link>
          ) : (
            <button onClick={handleSignOut} className="px-4 py-2 rounded-full text-white hover:bg-red-500">
              Sign out
            </button>
          )}
        </nav>

        {/* Logo Central */}
        <div className="text-lg font-bold text-white mx-auto">⚡</div>

        {/* Botão Direito */}
        <button className="px-6 py-2 rounded-full bg-white text-black hover:bg-gray-200">
          Contact
        </button>
      </div>
    </header>
  );
};

export default Header;
