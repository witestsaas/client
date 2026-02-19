import React from "react";

export default function VerifiedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-900">Email Verified</h1>
        <p className="text-center text-gray-700 mb-6">Your email has been successfully verified. You can now sign in to your account.</p>
        <div className="text-center">
          <a href="/signin" className="text-blue-600 hover:underline font-semibold">Go to Sign In</a>
        </div>
      </div>
    </main>
  );
}
