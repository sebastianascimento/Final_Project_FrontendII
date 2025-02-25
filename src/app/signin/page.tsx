"use client"

import { useEffect, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import GoogleIcon from "../components/auth/GoogleIcon";  

export default function SignIn() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const fetchedSession = await getSession();
        if (fetchedSession) {
          router.push("/dashboard");
        }
        setSession(fetchedSession);
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, [router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      console.log("Attempting to sign in...");
      const result = await signIn("google");
      if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
        <p className="text-center text-gray-500 mb-8">
          Please sign in to continue to your dashboard
        </p>

        {!session ? (
          <form className="space-y-4">
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full py-3 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition duration-200 flex items-center justify-center gap-4"
            >
              {isSigningIn ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <GoogleIcon />  
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-500">Redirecting...</p>
        )}
      </div>
    </div>
  );
}
