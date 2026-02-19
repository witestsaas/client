import React, { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitted(false);
    // TODO: Connect to backend
    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-900">Forgot Password</h1>
        {submitted ? (
          <p className="text-green-700 text-center">If an account exists for this email, a reset link has been sent.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Send Reset Link</button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          <a href="/signin" className="text-blue-600 hover:underline">Back to Sign In</a>
        </div>
      </div>
    </main>
  );
}
