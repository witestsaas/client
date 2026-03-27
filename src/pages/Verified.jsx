import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "../services/http";

export default function VerifiedPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        if (active) setStatus("error");
        return;
      }

      try {
        const response = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          throw new Error("Verification failed");
        }
        if (active) setStatus("success");
      } catch {
        if (active) setStatus("error");
      }
    }

    verify();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full text-center">
        {status === "loading" ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FFAA00]" />
            <p className="text-[#232323]/70 dark:text-white/70">Verifying your email...</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold text-blue-900 dark:text-white">Email Verified</h1>
            <p className="text-[#232323]/70 dark:text-white/70">Your email has been successfully verified. You can now sign in.</p>
            <Link to="/signin?verified=success" className="inline-block text-blue-600 dark:text-[#FFAA00] hover:underline font-semibold">Go to Sign In</Link>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-blue-900 dark:text-white">Verification Failed</h1>
            <p className="text-[#232323]/70 dark:text-white/70">This verification link is invalid or has expired.</p>
            <Link to="/signup" className="inline-block text-blue-600 dark:text-[#FFAA00] hover:underline font-semibold">Back to Sign Up</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
