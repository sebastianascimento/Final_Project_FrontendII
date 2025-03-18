// [2025-03-14 10:27:13] @sebastianascimento - Componente para mostrar empresa atual
"use client";

import { useSession } from "next-auth/react";

export default function CompanyBadge() {
  const { data: session } = useSession();
  
  if (!session?.user?.companyId) {
    return null;
  }
  
  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <span className="mr-1">🏢</span>
      {session.user.companyName}
    </div>
  );
}