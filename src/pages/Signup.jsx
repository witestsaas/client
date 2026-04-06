"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { motion, AnimatePresence } from "framer-motion";
=======
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { MicrosoftButton } from "../components/MicrosoftButton";
>>>>>>> 3321bfbfeed500405e3201324d9adab6ff0033fe
import { PasswordRequirements } from "../components/PasswordRequirements";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { CheckCircle, Mail, Zap, Bot, Globe, Shield } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import AIChatWidget from "../components/AIChatWidget";

const highlights = [
  { icon: Bot, stat: "10x", label: "Faster test creation" },
  { icon: Globe, stat: "85%", label: "Reduction in maintenance" },
  { icon: Shield, stat: "10x", label: "Faster test runs" },
];

const inputStyle = {
  base: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    caretColor: "#F29F05",
  },
  focus: { border: "1px solid rgba(242,159,5,0.6)", boxShadow: "0 0 0 3px rgba(242,159,5,0.1)" },
  blur: { border: "1px solid rgba(255,255,255,0.12)", boxShadow: "none" },
};

export default function SignupPage() {
  const { signup, startGoogleAuth, startMicrosoftAuth, getCaptchaChallenge } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showConfirmPasswordRequirements, setShowConfirmPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!showCaptcha) return;
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
        if (mounted) setCaptchaLoading(false);
      }
    }
    loadChallenge();
    return () => { mounted = false; };
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) { setError("Passwords do not match"); return; }
    if (showCaptcha && (!captchaId || !captchaAnswer.trim())) { setError("Please solve the CAPTCHA puzzle"); return; }
    setLoading(true);
    try {
      await signup({ firstName, lastName, username, email, password }, {
        captchaId: showCaptcha ? captchaId : undefined,
        captchaAnswer: showCaptcha ? captchaAnswer : undefined,
      });
      setSuccess(true);
    } catch (err) {
      const message = err.message || "Something went wrong";
      setError(message);
      const mustShowCaptcha = showCaptcha || /captcha/i.test(message);
      if (mustShowCaptcha) { setShowCaptcha(true); await refreshCaptcha(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <main className="flex h-screen h-[100dvh] overflow-hidden" style={{ background: "#0e0c1e" }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative flex-col justify-between overflow-hidden"
        style={{ background: "#13112a" }}
      >
        {/* Blobs */}
        <motion.div
          style={{
            position: "absolute", borderRadius: "50%",
            width: "700px", height: "700px",
            top: "calc(50% - 350px)", left: "-220px",
            background: "radial-gradient(circle at 55% 45%, #9B6FFF 0%, #5E00FF 30%, #3B00CC 55%, transparent 78%)",
            opacity: 0.45, filter: "blur(80px)", mixBlendMode: "screen",
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
            opacity: 0.38, filter: "blur(70px)", mixBlendMode: "screen",
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
            Get started free
          </motion.p>
          <motion.h2
            className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            Start testing smarter,<br />faster
          </motion.h2>
          <motion.p
            className="text-white/50 text-base xl:text-lg leading-relaxed mb-10 max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            AI-powered test creation and automation — zero scripting, full coverage.
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

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: "#0e0c1e" }}>

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F29F05" }}>
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-white">Qalion</span>
          </Link>
          <Link to="/signin" className="text-sm font-medium hover:underline" style={{ color: "#F29F05" }}>
            Sign in
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
              className="text-2xl sm:text-3xl font-bold mb-1 text-white tracking-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
            >
              Create your account
            </motion.h1>
            <motion.p
              className="text-sm mb-6"
              style={{ color: "rgba(255,255,255,0.4)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32, ease: "easeOut" }}
            >
              Get started free — no credit card required.
            </motion.p>

            {/* ── Success state ── */}
            <AnimatePresence>
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <Mail className="w-8 h-8" style={{ color: "#34d399" }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    We sent a verification link to{" "}
                    <span className="font-medium text-white">{email}</span>
                  </p>
                  <div className="flex items-center gap-2 justify-center" style={{ color: "#34d399" }}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Account created successfully</span>
                  </div>
                  <p className="mt-5 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    After verification, continue to{" "}
                    <Link to="/signin" className="font-medium hover:underline" style={{ color: "#F29F05" }}>Sign in</Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <>
<<<<<<< HEAD
                {/* Google button */}
                <motion.button
                  type="button"
=======
                <div className="space-y-3">
                <GoogleButton
                  label="Sign up with Google"
                  disabled={loading}
>>>>>>> 3321bfbfeed500405e3201324d9adab6ff0033fe
                  onClick={startGoogleAuth}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.38, ease: "easeOut" }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.69 1.22 9.19 3.22l6.85-6.85C35.9 2.27 30.47 0 24 0 14.64 0 6.61 5.38 2.68 13.22l7.98 6.19C12.47 13.09 17.77 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.38c-.54 2.9-2.16 5.36-4.6 7.04l7.07 5.49C43.91 37.15 46.1 31.32 46.1 24.5z"/>
                    <path fill="#FFAA00" d="M10.66 28.59A14.38 14.38 0 019.5 24c0-1.6.28-3.15.78-4.59l-7.98-6.19A23.93 23.93 0 000 24c0 3.86.93 7.5 2.32 10.78l8.34-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.91-2.13 15.88-5.81l-7.07-5.49c-1.96 1.31-4.47 2.09-8.81 2.09-6.23 0-11.53-3.59-13.34-8.81l-8.34 6.19C6.61 42.62 14.64 48 24 48z"/>
                  </svg>
                  Sign up with Google
                </motion.button>

<<<<<<< HEAD
                {/* Separator */}
                <motion.div
                  className="relative my-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.44 }}
                >
=======
                <MicrosoftButton
                  label="Sign up with Microsoft"
                  disabled={loading}
                  onClick={startMicrosoftAuth}
                />
                </div>
                <div className="relative my-5">
>>>>>>> 3321bfbfeed500405e3201324d9adab6ff0033fe
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3" style={{ background: "#0e0c1e", color: "rgba(255,255,255,0.3)" }}>or sign up with email</span>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit}>
                  {/* First name + Last name */}
                  <motion.div
                    className="grid grid-cols-2 gap-3 mb-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.48, ease: "easeOut" }}
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>First name</label>
                      <input
                        type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                        style={inputStyle.base}
                        onFocus={e => Object.assign(e.target.style, inputStyle.focus)}
                        onBlur={e => Object.assign(e.target.style, inputStyle.blur)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Last name</label>
                      <input
                        type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                        style={inputStyle.base}
                        onFocus={e => Object.assign(e.target.style, inputStyle.focus)}
                        onBlur={e => Object.assign(e.target.style, inputStyle.blur)}
                      />
                    </div>
                  </motion.div>

                  {/* Username */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.53, ease: "easeOut" }}
                  >
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Username</label>
                    <input
                      type="text" value={username} onChange={e => setUsername(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                      style={inputStyle.base}
                      onFocus={e => Object.assign(e.target.style, inputStyle.focus)}
                      onBlur={e => Object.assign(e.target.style, inputStyle.blur)}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.58, ease: "easeOut" }}
                  >
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                      style={inputStyle.base}
                      onFocus={e => Object.assign(e.target.style, inputStyle.focus)}
                      onBlur={e => Object.assign(e.target.style, inputStyle.blur)}
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className="relative mb-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.63, ease: "easeOut" }}
                  >
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={e => { Object.assign(e.target.style, inputStyle.focus); setShowPasswordRequirements(true); }}
                      onBlur={e => { Object.assign(e.target.style, inputStyle.blur); setShowPasswordRequirements(false); }}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors pr-10"
                      style={inputStyle.base}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 bottom-[9px] transition-colors"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    <PasswordRequirements password={password} showRequirements={showPasswordRequirements} />
                  </motion.div>

                  {/* Confirm password */}
                  <motion.div
                    className="relative mb-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.68, ease: "easeOut" }}
                  >
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Confirm password</label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                      onFocus={e => { Object.assign(e.target.style, inputStyle.focus); setShowConfirmPasswordRequirements(true); }}
                      onBlur={e => { Object.assign(e.target.style, inputStyle.blur); setShowConfirmPasswordRequirements(false); }}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors pr-10"
                      style={inputStyle.base}
                    />
                    <button
                      type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 bottom-[9px] transition-colors"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    <PasswordRequirements password={passwordConfirm} showRequirements={showConfirmPasswordRequirements} />
                  </motion.div>

                  {/* Already have an account */}
                  <motion.p
                    className="mt-1 mb-4 text-center text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    Already have an account?{" "}
                    <Link to="/signin" className="font-semibold hover:underline" style={{ color: "#F29F05" }}>Sign in</Link>
                  </motion.p>

                  {/* CAPTCHA */}
                  <AnimatePresence>
                    {showCaptcha && (
                      <motion.div
                        key="captcha"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mb-4 rounded-lg p-3 overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Solve the CAPTCHA puzzle</p>
                          <button
                            type="button" onClick={refreshCaptcha}
                            disabled={captchaLoading || loading}
                            className="text-xs hover:underline disabled:opacity-50"
                            style={{ color: "#F29F05" }}
                          >
                            Refresh
                          </button>
                        </div>
                        {captchaImage ? (
                          <img src={captchaImage} alt="CAPTCHA challenge" className="h-16 w-full rounded-md object-contain"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }} />
                        ) : (
                          <div className="h-16 w-full rounded-md flex items-center justify-center text-xs"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
                            {captchaLoading ? "Loading CAPTCHA..." : "CAPTCHA unavailable"}
                          </div>
                        )}
                        <input
                          type="text" value={captchaAnswer}
                          onChange={e => setCaptchaAnswer(e.target.value)}
                          placeholder="Enter characters shown"
                          className="mt-3 w-full rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F29F05]"
                          style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
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

                  {/* Submit */}
                  <motion.button
                    disabled={loading}
                    className="w-full font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70"
                    style={{ background: "#F29F05", color: "#000" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#d98e04"}
                    onMouseLeave={e => e.currentTarget.style.background = "#F29F05"}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.73, ease: "easeOut" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </motion.button>
                </form>

                <motion.p
                  className="mt-5 text-center text-xs"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.78 }}
                >
                  By signing up, you agree to our{" "}
                  <a href="#" className="hover:underline" style={{ color: "rgba(255,255,255,0.45)" }}>Terms</a> and{" "}
                  <a href="#" className="hover:underline" style={{ color: "rgba(255,255,255,0.45)" }}>Privacy Policy</a>.
                </motion.p>

              </>
            )}
          </motion.div>
        </div>
      </div>
    </main>
    <AIChatWidget />
    </>
  );
}
