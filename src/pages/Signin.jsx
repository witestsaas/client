"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function SigninPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, startGoogleAuth, getCaptchaChallenge } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showCaptcha) {
      return;
    }

    let mounted = true;

    async function loadChallenge() {
      setCaptchaLoading(true);
      try {
        const challenge = await getCaptchaChallenge();
        if (!mounted) return;
        setCaptchaId(challenge?.challengeId || "");
        setCaptchaImage(challenge?.imageData || "");
        setCaptchaAnswer("");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load CAPTCHA");
      } finally {
        if (mounted) {
          setCaptchaLoading(false);
        }
      }
    }

    loadChallenge();
    return () => {
      mounted = false;
    };
  }, [getCaptchaChallenge, showCaptcha]);

  async function refreshCaptcha() {
    setCaptchaLoading(true);
    try {
      const challenge = await getCaptchaChallenge();
      setCaptchaId(challenge?.challengeId || "");
      setCaptchaImage(challenge?.imageData || "");
      setCaptchaAnswer("");
    } catch (err) {
      setError(err.message || "Failed to refresh CAPTCHA");
    } finally {
      setCaptchaLoading(false);
    }
  }

  const resetSuccess = searchParams.get("reset") === "success";
  const verifySuccess = searchParams.get("verified") === "success";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (showCaptcha && (!captchaId || !captchaAnswer.trim())) {
      setError("Please solve the CAPTCHA puzzle");
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password, {
        captchaId: showCaptcha ? captchaId : undefined,
        captchaAnswer: showCaptcha ? captchaAnswer : undefined,
      });
      if (result?.requiresMfa && result?.challengeToken) {
        const nextUrl = `/auth/mfa?challenge=${encodeURIComponent(result.challengeToken)}&expires=${encodeURIComponent(String(result.expiresInSec || 300))}`;
        navigate(nextUrl, { replace: true });
        return;
      }

      const profile = result;
      const targetPath = profile?.orgSlug ? `/dashboard/${profile.orgSlug}` : "/dashboard/no-org";
      navigate(targetPath, { replace: true });
    } catch (err) {
      const message = err.message || "Invalid username or password";
      setError(message);

      const mustShowCaptcha = showCaptcha || /captcha/i.test(message);
      if (mustShowCaptcha) {
        setShowCaptcha(true);
        await refreshCaptcha();
      }

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500">
          <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-900 dark:text-white tracking-tight animate-fade-in">Sign in to your account</h1>
          {resetSuccess ? (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              Your password has been reset successfully. You can sign in now.
            </div>
          ) : null}
          {verifySuccess ? (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              Email verified successfully. You can sign in now.
            </div>
          ) : null}
          <form onSubmit={handleSubmit}>
            <Input
              label="Username or email"
              value={username}
              onChange={setUsername}
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
                className="absolute right-3 top-[38px] text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {showCaptcha ? (
            <div className="mb-4 rounded-md border border-blue-100 dark:border-white/10 p-3 bg-slate-50/60 dark:bg-[#232323]/60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600 dark:text-white/70">Solve the CAPTCHA puzzle</p>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  disabled={captchaLoading || loading}
                  className="text-xs text-blue-600 dark:text-[#FFAA00] hover:underline disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              {captchaImage ? (
                <img
                  src={captchaImage}
                  alt="CAPTCHA challenge"
                  className="h-16 w-full rounded-md border border-slate-200 dark:border-white/10 object-contain bg-white dark:bg-[#1f1f1f]"
                />
              ) : (
                <div className="h-16 w-full rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-white/60">
                  {captchaLoading ? "Loading CAPTCHA..." : "CAPTCHA unavailable"}
                </div>
              )}
              <input
                type="text"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Enter characters shown"
                className="mt-3 w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-[#2A2A2A] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#FFAA00]"
              />
            </div>
            ) : null}
            {error && (
              <p className="text-red-600 text-sm mb-3">{error}</p>
            )}
            <button
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-[#FFAA00] text-white dark:text-[#232323] py-2 rounded-md transition hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="mt-6">
            <GoogleButton
              label="Sign in with Google"
              disabled={loading}
              onClick={startGoogleAuth}
            />
          </div>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-white/70">
            <Link to="/forgot-password" className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium">
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-white/70">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
