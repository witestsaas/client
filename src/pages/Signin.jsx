
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Signin = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    window.location.href = '/dashboard/default';
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#232323] via-[#F6F6F6] to-[#232323] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-8 animate-fade-in-up transition-all duration-500">
          <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-900 tracking-tight animate-fade-in">Sign in to your account</h1>
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-blue-300 focus:outline-none mb-4"
            onClick={() => loginWithRedirect()}
          >
            Sign in with Auth0
          </button>
          <button
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-green-300 focus:outline-none"
            onClick={() => loginWithRedirect({ screen_hint: 'signup' })}
          >
            Sign up
          </button>
        </div>
      </div>
    </main>
  );
};

export default Signin;
