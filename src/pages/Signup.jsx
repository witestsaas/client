"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { CheckCircle, Mail } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function SignupPage() {
  const { signup, startGoogleAuth, getCaptchaChallenge } = useAuth();
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500">
          <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-900 dark:text-white tracking-tight animate-fade-in">Create your account</h1>

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Check your email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We’ve sent a verification link to <span className="font-medium text-foreground">{email}</span>
              </p>
              <div className="flex items-center gap-2 justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Account created successfully</span>
              </div>
              <p className="mt-5 text-center text-sm text-gray-600 dark:text-white/70">
                After verification, continue to{" "}
                <Link to="/signin" className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <GoogleButton
                  label="Sign up with Google"
                  disabled={loading}
                  onClick={startGoogleAuth}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <Input
                  label="First name"
                  value={firstName}
                  onChange={setFirstName}
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChange={setLastName}
                />
                <Input
                  label="Username"
                  value={username}
                  onChange={setUsername}
                />
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
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
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
                  <PasswordRequirements
                    password={password}
                    showRequirements={showPasswordRequirements}
                  />
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
                  <PasswordRequirements
                    password={passwordConfirm}
                    showRequirements={showConfirmPasswordRequirements}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-[38px] text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
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
                  className="w-full bg-blue-600 dark:bg-[#FFAA00] text-white dark:text-[#232323] py-2 rounded-md transition
                    hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Sign up"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-white/70">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
