import React from "react";

export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <svg
        className="animate-spin h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="#FFAA00"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#FFAA00"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
