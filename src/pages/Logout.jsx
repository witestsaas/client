import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function LogoutPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await logout();
      if (!cancelled) {
        navigate("/signin", { replace: true });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [logout, navigate]);

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-5 sm:p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Logging out...</h1>
        <p className="text-gray-700">You are being signed out. Redirecting to sign in page.</p>
      </div>
    </main>
  );
}
