import React, { useState } from "react";

export default function ResetPasswordUpdatePage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // TODO: Connect to backend
    setSuccess(true);
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-5 sm:p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-900">Update Password</h1>
        {success ? (
          <p className="text-green-700 text-center">Your password has been updated. You can now <a href='/signin' className='text-blue-600 hover:underline'>sign in</a>.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors cursor-pointer">Update Password</button>
          </form>
        )}
      </div>
    </main>
  );
}
