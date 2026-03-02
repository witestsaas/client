import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { apiFetch } from "../services/http";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenValid, setTokenValid] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      if (!token) {
        if (active) setTokenValid(false);
        return;
      }

      try {
        const response = await apiFetch(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`);
        const payload = await response.json().catch(() => ({}));
        if (active) {
          setTokenValid(Boolean(payload?.valid));
        }
      } catch {
        if (active) {
          setTokenValid(false);
        }
      }
    }

    verifyToken();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/reset-password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || "Failed to reset password");
      }

      navigate("/signin?reset=success", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
        <div className="text-center text-sm text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking reset link...
        </div>
      </main>
    );
  }

  if (!tokenValid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
        <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-blue-900 dark:text-white mb-3">Link expired</h1>
          <p className="text-sm text-[#232323]/65 dark:text-white/65 mb-5">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="inline-block bg-blue-600 dark:bg-[#FFAA00] hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 text-white dark:text-[#232323] font-semibold py-2 px-5 rounded-md transition-colors">
            Request new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
      <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-900 dark:text-white">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-md border border-border bg-muted text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#FFAA00]/50 placeholder-muted-foreground"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
            <PasswordRequirements password={password} showRequirements={showPasswordRequirements} />
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full rounded-md border border-border bg-muted text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#FFAA00]/50 placeholder-muted-foreground"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button disabled={loading} type="submit" className="w-full bg-blue-600 dark:bg-[#FFAA00] hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 text-white dark:text-[#232323] font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-70">{loading ? "Updating..." : "Reset Password"}</button>
        </form>
      </div>
    </main>
  );
}
