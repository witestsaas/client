import React, { useState } from "react";

export default function ResetPasswordConfirmPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  function handleConfirm() {
    // TODO: Connect to backend to confirm reset token
    setConfirmed(true);
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Confirm Password Reset</h1>
        {confirmed ? (
          <p className="text-green-700">Your password reset has been confirmed. You can now <a href='/signin' className='text-blue-600 hover:underline'>sign in</a>.</p>
        ) : (
          <>
            <p className="mb-6 text-gray-700">Click the button below to confirm your password reset.</p>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button onClick={handleConfirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Confirm Reset</button>
          </>
        )}
      </div>
    </main>
  );
}
