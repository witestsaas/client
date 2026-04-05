"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { MicrosoftButton } from "../components/MicrosoftButton";
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (showCaptcha && (!captchaId || !captchaAnswer.trim())) {
      setError("Please solve the CAPTCHA puzzle");
      return;
    }

    setLoading(true);
    try {
      await signup({
        firstName,
        lastName,
        username,
        email,
        password,
      }, {
        captchaId: showCaptcha ? captchaId : undefined,
        captchaAnswer: showCaptcha ? captchaAnswer : undefined,
      });
      setSuccess(true);
    } catch (err) {
      const message = err.message || "Something went wrong";
      setError(message);

      const mustShowCaptcha = showCaptcha || /captcha/i.test(message);
      if (mustShowCaptcha) {
        setShowCaptcha(true);
        await refreshCaptcha();
      }
    } finally {
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
            Start testing with AI
          </h2>
          <p className="text-white/80 text-base xl:text-lg leading-relaxed mb-10 max-w-md">
            See how AI-powered testing can transform your software quality  zero scripting, full coverage.
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
          <Link to="/signin" className="text-sm text-[#ffb733] hover:underline font-medium">
            Sign in
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-8">
          <div className="w-full max-w-md">
            <div className="hidden lg:flex justify-end mb-6">
              <span className="text-sm text-gray-500 dark:text-white/50">
                Already have an account?{" "}
                <Link to="/signin" className="text-[#ffb733] hover:underline font-semibold">Sign in</Link>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
              Get started free  no credit card required.
            </p>

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Check your email</h3>
                <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
                  We sent a verification link to <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                </p>
                <div className="flex items-center gap-2 justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Account created successfully</span>
                </div>
                <p className="mt-5 text-sm text-gray-500 dark:text-white/50">
                  After verification, continue to{" "}
                  <Link to="/signin" className="text-[#ffb733] hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                <GoogleButton
                  label="Sign up with Google"
                  disabled={loading}
                  onClick={startGoogleAuth}
                />

                <MicrosoftButton
                  label="Sign up with Microsoft"
                  disabled={loading}
                  onClick={startMicrosoftAuth}
                />
                </div>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-[#08080d] px-3 text-gray-400 dark:text-white/30">or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" value={firstName} onChange={setFirstName} />
                    <Input label="Last name" value={lastName} onChange={setLastName} />
                  </div>
                  <Input label="Username" value={username} onChange={setUsername} />
                  <Input label="Email" type="email" value={email} onChange={setEmail} />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      onFocus={() => setShowPasswordRequirements(true)}
                      onBlur={() => setShowPasswordRequirements(false)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    <PasswordRequirements password={password} showRequirements={showPasswordRequirements} />
                  </div>
                  <div className="relative">
                    <Input
                      label="Confirm password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={setPasswordConfirm}
                      onFocus={() => setShowConfirmPasswordRequirements(true)}
                      onBlur={() => setShowConfirmPasswordRequirements(false)}
                    />
                    <PasswordRequirements password={passwordConfirm} showRequirements={showConfirmPasswordRequirements} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
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
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-400 dark:text-white/30">
                  By signing up, you agree to our{" "}
                  <a href="#" className="underline">Terms</a> and{" "}
                  <a href="#" className="underline">Privacy Policy</a>.
                </p>

                <p className="lg:hidden mt-4 text-center text-sm text-gray-500 dark:text-white/50">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-[#ffb733] hover:underline font-semibold">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
    <AIChatWidget />
    </>
  );
}