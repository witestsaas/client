"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Zap, Bot, Globe, Shield } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import AIChatWidget from "../components/AIChatWidget";

const highlights = [
  { icon: Bot, stat: "10x", label: "Faster test creation" },
  { icon: Globe, stat: "85%", label: "Reduction in maintenance" },
  { icon: Shield, stat: "10x", label: "Faster test runs" },
];

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
    <>
    <main className="flex h-screen h-[100dvh] overflow-hidden bg-white dark:bg-[#08080d]">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ffb733 0%, #ff8c00 60%, #e67a00 100%)" }}
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-black/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5" />

        <div className="relative z-10 p-8 xl:p-12">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-black/15 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/25 transition-colors">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Qalion</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center p-8 xl:p-12">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
            Welcome back
          </h2>
          <p className="text-white/80 text-base xl:text-lg leading-relaxed mb-10 max-w-md">
            Pick up right where you left off  your tests, results, and AI insights are waiting.
          </p>

          <div className="flex gap-6 xl:gap-8">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl xl:text-3xl font-bold text-white">{h.stat}</p>
                  <p className="text-xs text-white/70 mt-0.5 leading-tight">{h.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 p-8 xl:p-12">
          <p className="text-xs text-white/50">&copy; 2026 Qalion. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ffb733] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm dark:text-white">Qalion</span>
          </Link>
          <Link to="/signup" className="text-sm text-[#ffb733] hover:underline font-medium">
            Sign up
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-8">
          <div className="w-full max-w-md">
            <div className="hidden lg:flex justify-end mb-6">
              <span className="text-sm text-gray-500 dark:text-white/50">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#ffb733] hover:underline font-semibold">Sign up</Link>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-white tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
              Enter your credentials to continue.
            </p>

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

            <GoogleButton
              label="Sign in with Google"
              disabled={loading}
              onClick={startGoogleAuth}
            />

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-[#08080d] px-3 text-gray-400 dark:text-white/30">or sign in with email</span>
              </div>
            </div>

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
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex justify-end mb-4">
                <Link to="/forgot-password" className="text-sm text-[#ffb733] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              {showCaptcha ? (
                <div className="mb-4 rounded-lg border border-gray-200 dark:border-white/10 p-3 bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-white/70">Solve the CAPTCHA puzzle</p>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      disabled={captchaLoading || loading}
                      className="text-xs text-[#ffb733] hover:underline disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                  {captchaImage ? (
                    <img src={captchaImage} alt="CAPTCHA challenge" className="h-16 w-full rounded-md border border-gray-200 dark:border-white/10 object-contain bg-white dark:bg-[#111]" />
                  ) : (
                    <div className="h-16 w-full rounded-md border border-gray-200 dark:border-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-white/40">
                      {captchaLoading ? "Loading CAPTCHA..." : "CAPTCHA unavailable"}
                    </div>
                  )}
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Enter characters shown"
                    className="mt-3 w-full rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-[#111] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ffb733]"
                  />
                </div>
              ) : null}

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <button
                disabled={loading}
                className="w-full bg-[#ffb733] hover:bg-[#e5a22e] text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="lg:hidden mt-4 text-center text-sm text-gray-500 dark:text-white/50">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#ffb733] hover:underline font-semibold">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
    <AIChatWidget />
    </>
  );
}