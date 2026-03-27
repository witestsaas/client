import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { apiFetch } from "../services/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const response = await apiFetch("/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.error || "Failed to send reset link");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Failed to send reset link");
    }
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-black dark:text-white">Forgot Password</h1>
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFAA00]/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#FFAA00]" />
            </div>
            <p className="text-black dark:text-white text-center">
              If an account exists for <span className="font-medium">{email}</span>, a reset link has been sent.
            </p>
            <div className="mt-6 text-center text-sm">
              <Link to="/signin" className="text-blue-600 dark:text-[#FFAA00] hover:underline">Back to Sign In</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="w-full rounded-md border border-border bg-muted text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#FFAA00]/50 placeholder-muted-foreground"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 dark:bg-[#FFAA00] hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 text-white dark:text-[#232323] font-semibold py-2 px-4 rounded-md transition-colors">Send Reset Link</button>
          </form>
        )}
        {!submitted ? (
          <div className="mt-6 text-center text-sm">
            <Link to="/signin" className="text-blue-600 dark:text-[#FFAA00] hover:underline">Back to Sign In</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
