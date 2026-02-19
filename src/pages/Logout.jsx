import React, { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    // TODO: Call backend to log out, clear tokens, etc.
    window.location.href = "/signin";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Logging out...</h1>
        <p className="text-gray-700">You are being signed out. Redirecting to sign in page.</p>
      </div>
    </main>
  );
}
