"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

// Componente que usa useSearchParams
function SignInContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/auth-redirect";
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signIn("google", {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <p className="font-bold">Erro no login</p>
          <p className="text-sm">
            Ocorreu um problema ao fazer login: {error}
          </p>
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        {loading ? (
          "Carregando..."
        ) : (
          <>
            <svg
              width="20"
              height="20"
              fill="currentColor"
              className="text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Entrar com Google
          </>
        )}
      </button>
    </>
  );
}

// Componente cliente para login
export default function LoginClient() {
  return (
    <Suspense fallback={<div className="text-center">Carregando...</div>}>
      <SignInContent />
    </Suspense>
  );
}