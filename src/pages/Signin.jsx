
"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { MicrosoftButton } from "../components/MicrosoftButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      if (email === "test@example.com" && password === "password") {
        setSuccess(true);
        setError("");
      } else {
        setError("Invalid email or password");
        setSuccess(false);
      }
      setLoading(false);
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500">
          <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-900 tracking-tight animate-fade-in">Sign in to your account</h1>
          {success ? (
            <p className="text-green-600 text-center">
              Signed in successfully! ✔
            </p>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mb-3">{error}</p>
                )}
                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
              <div className="flex justify-center gap-6 mt-8 animate-fade-in-up">
                  <button type="button" className="rounded-full p-3 bg-blue-50 hover:bg-blue-100 transition-colors shadow" title="Sign up with Google">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_17_40)"><path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.482h6.48a5.54 5.54 0 01-2.4 3.632v3.012h3.872c2.266-2.088 3.574-5.164 3.574-8.77z" fill="#4285F4"/><path d="M12.24 24c3.24 0 5.96-1.072 7.946-2.92l-3.872-3.012c-1.08.728-2.46 1.16-4.074 1.16-3.132 0-5.78-2.116-6.73-4.956H1.54v3.112A11.997 11.997 0 0012.24 24z" fill="#34A853"/><path d="M5.51 14.272a7.19 7.19 0 010-4.544V6.616H1.54a12.002 12.002 0 000 10.768l3.97-3.112z" fill="#FBBC05"/><path d="M12.24 4.772c1.764 0 3.34.606 4.584 1.792l3.432-3.432C18.196 1.072 15.48 0 12.24 0A11.997 11.997 0 001.54 6.616l3.97 3.112c.95-2.84 3.598-4.956 6.73-4.956z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs>
                    </svg>
                  </button>
                  <button type="button" className="rounded-full p-3 bg-blue-50 hover:bg-blue-100 transition-colors shadow" title="Sign up with Microsoft">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="9" height="9" fill="#F35325"/>
                      <rect x="13" y="2" width="9" height="9" fill="#81BC06"/>
                      <rect x="2" y="13" width="9" height="9" fill="#05A6F0"/>
                      <rect x="13" y="13" width="9" height="9" fill="#FFBA08"/>
                    </svg>
                  </button>
                </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 1s ease both; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </main>
  );
}
