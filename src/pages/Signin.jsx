"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { MicrosoftButton } from "../components/MicrosoftButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Zap, Bot, Globe, Shield } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import AIChatWidget from "../components/AIChatWidget";
import { useTheme } from "../utils/theme-context";

const highlights = [
  { icon: Bot, stat: "10x", label: "Faster test creation" },
  { icon: Globe, stat: "85%", label: "Reduction in maintenance" },
  { icon: Shield, stat: "10x", label: "Faster test runs" },
];

export default function SigninPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const mainBg       = isDark ? "#0e0c1e"                      : "#f4f5fb";
  const leftBg       = "#13112a";
  const textPrimary  = isDark ? "#ffffff"                      : "#0f0f1a";
  const textMuted    = isDark ? "rgba(255,255,255,0.50)"       : "rgba(0,0,0,0.52)";
  const textSubtle   = isDark ? "rgba(255,255,255,0.40)"       : "rgba(0,0,0,0.45)";
const borderSm     = isDark ? "rgba(255,255,255,0.07)"       : "rgba(0,0,0,0.08)";
  const borderMd     = isDark ? "rgba(255,255,255,0.10)"       : "rgba(0,0,0,0.10)";
  const inputBg      = isDark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.04)";
  const inputBorder  = isDark ? "rgba(255,255,255,0.12)"       : "rgba(0,0,0,0.12)";
  const captchaBg    = isDark ? "rgba(255,255,255,0.04)"       : "rgba(0,0,0,0.03)";

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, startGoogleAuth, startMicrosoftAuth, getCaptchaChallenge } = useAuth();
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
    <main className="flex h-screen h-[100dvh] overflow-hidden" style={{ background: mainBg }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative flex-col justify-between overflow-hidden"
        style={{ background: leftBg }}
      >
        {/* Animated blobs */}
        <motion.div
          style={{
            position: "absolute", borderRadius: "50%",
            width: "700px", height: "700px",
            top: "calc(50% - 350px)", left: "-220px",
            background: "radial-gradient(circle at 55% 45%, #9B6FFF 0%, #5E00FF 30%, #3B00CC 55%, transparent 78%)",
            opacity: isDark ? 0.45 : 0.25, filter: "blur(80px)", mixBlendMode: "screen",
          }}
          animate={{ scale: [1, 1.07, 0.96, 1.04, 1], x: [0, 25, -12, 16, 0], y: [0, -35, 20, -10, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            position: "absolute", borderRadius: "50%",
            width: "550px", height: "550px",
            top: "-80px", right: "-120px",
            background: "radial-gradient(circle at 42% 52%, #FDE68A 0%, #F29F05 20%, #D97706 45%, transparent 75%)",
            opacity: isDark ? 0.38 : 0.60, filter: "blur(70px)", mixBlendMode: "screen",
          }}
          animate={{ scale: [1, 1.1, 0.94, 1.06, 1], x: [0, -25, 15, -10, 0], y: [0, 40, -22, 16, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Amber top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{ background: "linear-gradient(90deg, transparent, #F29F05 40%, transparent)" }}
        />

        {/* Logo */}
        <motion.div
          className="relative z-10 p-8 xl:p-12"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#F29F05", boxShadow: "0 2px 12px rgba(242,159,5,0.35)" }}
            >
              <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Qalion</span>
          </Link>
        </motion.div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-8 xl:p-12">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: "#F29F05" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            Welcome back
          </motion.p>
          <motion.h2
            className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            Pick up right<br />where you left off
          </motion.h2>
          <motion.p
            className="text-white/50 text-base xl:text-lg leading-relaxed mb-10 max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            Your tests, results, and AI insights are waiting.
          </motion.p>

          <div className="flex gap-6 xl:gap-8">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={h.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.45 + i * 0.1, ease: "easeOut" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: "rgba(242,159,5,0.12)", border: "1px solid rgba(242,159,5,0.25)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#F29F05" }} />
                  </div>
                  <p className="text-2xl xl:text-3xl font-bold text-white">{h.stat}</p>
                  <p className="text-xs text-white/50 mt-0.5 leading-tight">{h.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="relative z-10 p-8 xl:p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-xs text-white/25">&copy; 2026 Qalion. All rights reserved.</p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: mainBg }}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4" style={{ borderBottom: `1px solid ${borderSm}` }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F29F05" }}>
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm" style={{ color: textPrimary }}>Qalion</span>
          </Link>
          <Link to="/signup" className="text-sm hover:underline font-medium" style={{ color: "#F29F05" }}>
            Sign up
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-8">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.h1
              className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight"
              style={{ color: textPrimary }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
            >
              Sign in to your account
            </motion.h1>
            <motion.p
              className="text-sm mb-6"
              style={{ color: textSubtle }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32, ease: "easeOut" }}
            >
              Enter your credentials to continue.
            </motion.p>

<AnimatePresence>
  {resetSuccess && (
    <motion.div
      key="reset"
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400"
    >
      Your password has been reset successfully. You can sign in now.
    </motion.div>
  )}
  {verifySuccess && (
    <motion.div
      key="verify"
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400"
    >
      Email verified successfully. You can sign in now.
    </motion.div>
  )}
</AnimatePresence>

<div className="space-y-3">
  <GoogleButton
    label="Sign in with Google"
    disabled={loading}
    onClick={startGoogleAuth}
  />

  <MicrosoftButton
    label="Sign in with Microsoft"
    disabled={loading}
    onClick={startMicrosoftAuth}
  />
</div>

            <motion.div
              className="relative my-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.44 }}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: `1px solid ${borderMd}` }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3" style={{ background: mainBg, color: textSubtle }}>or sign in with email</span>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
              {/* Input username */}
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
              >
                <label className="block text-sm font-medium mb-1.5" style={{ color: textMuted }}>
                  Username or email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, caretColor: "#F29F05" }}
                  onFocus={e => { e.target.style.border = "1px solid rgba(242,159,5,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(242,159,5,0.1)"; }}
                  onBlur={e => { e.target.style.border = `1px solid ${inputBorder}`; e.target.style.boxShadow = "none"; }}
                />
              </motion.div>

              {/* Input password */}
              <motion.div
                className="relative mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.57, ease: "easeOut" }}
              >
                <label className="block text-sm font-medium mb-1.5" style={{ color: textMuted }}>
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors pr-10"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, caretColor: "#F29F05" }}
                  onFocus={e => { e.target.style.border = "1px solid rgba(242,159,5,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(242,159,5,0.1)"; }}
                  onBlur={e => { e.target.style.border = `1px solid ${inputBorder}`; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-[9px] transition-colors"
                  style={{ color: textSubtle }}
                  onMouseEnter={e => e.currentTarget.style.color = textMuted}
                  onMouseLeave={e => e.currentTarget.style.color = textSubtle}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </motion.div>

              <motion.div
                className="flex items-center justify-between mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.63 }}
              >
                <span className="text-sm" style={{ color: textSubtle }}>
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-semibold hover:underline" style={{ color: "#F29F05" }}>Sign up</Link>
                </span>
                <Link to="/forgot-password" className="text-sm hover:underline font-medium" style={{ color: "#F29F05" }}>
                  Forgot password?
                </Link>
              </motion.div>

              <AnimatePresence>
                {showCaptcha && (
                  <motion.div
                    key="captcha"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mb-4 rounded-lg p-3 overflow-hidden"
                    style={{ border: `1px solid ${borderMd}`, background: captchaBg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium" style={{ color: textMuted }}>Solve the CAPTCHA puzzle</p>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        disabled={captchaLoading || loading}
                        className="text-xs hover:underline disabled:opacity-50"
                        style={{ color: "#F29F05" }}
                      >
                        Refresh
                      </button>
                    </div>
                    {captchaImage ? (
                      <img src={captchaImage} alt="CAPTCHA challenge" className="h-16 w-full rounded-md object-contain" style={{ border: `1px solid ${borderMd}`, background: inputBg }} />
                    ) : (
                      <div className="h-16 w-full rounded-md flex items-center justify-center text-xs" style={{ border: `1px solid ${borderMd}`, color: textSubtle }}>
                        {captchaLoading ? "Loading CAPTCHA..." : "CAPTCHA unavailable"}
                      </div>
                    )}
                    <input
                      type="text"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Enter characters shown"
                      className="mt-3 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F29F05]"
                      style={{ border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-red-400 text-sm mb-3"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                disabled={loading}
                className="w-full font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70"
                style={{ background: "#F29F05", color: "#000" }}
                onMouseEnter={e => e.currentTarget.style.background = "#d98e04"}
                onMouseLeave={e => e.currentTarget.style.background = "#F29F05"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.68, ease: "easeOut" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </motion.button>
            </form>

          </motion.div>
        </div>
      </div>
    </main>
    <AIChatWidget />
    </>
  );
}
