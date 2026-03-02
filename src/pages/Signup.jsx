"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { GoogleButton } from "../components/GoogleButton";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, startGoogleAuth } = useAuth();
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const profile = await signup({
        firstName,
        lastName,
        username,
        email,
        password,
      });
      const targetPath = profile?.orgSlug ? `/dashboard/${profile.orgSlug}` : "/dashboard/no-org";
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500">
          <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-900 dark:text-white tracking-tight animate-fade-in">Create your account</h1>
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
          <div className="mt-6">
            <GoogleButton
              label="Sign up with Google"
              disabled={loading}
              onClick={startGoogleAuth}
            />
          </div>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-white/70">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
