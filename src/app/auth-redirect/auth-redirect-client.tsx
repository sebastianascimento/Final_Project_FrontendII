'use client';

import { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthRedirectClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Your existing client-side redirect logic
    if (status === "authenticated") {
      // Redirect to dashboard or appropriate page
      router.push('/dashboard');
    } else if (status === "unauthenticated") {
      // Redirect to login
      router.push('/login');
    }
    // Don't redirect while loading
  }, [status, router]);

  // Your loading UI
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
        <h1 className="text-xl font-semibold">Redirecionando...</h1>
        <p className="text-gray-600">Por favor, aguarde um momento.</p>
      </div>
    </div>
  );
}