"use client";

type GoogleButtonProps = {
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export function GoogleButton({ label = "Continue with Google", disabled, onClick }: GoogleButtonProps) {
  function handleGoogleAuth() {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 border border-border rounded-md py-2 transition text-foreground cursor-pointer
        ${disabled ? 'opacity-60 cursor-not-allowed bg-muted' : 'hover:bg-accent hover:text-accent-foreground'}
        dark:text-white`}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.69 1.22 9.19 3.22l6.85-6.85C35.9 2.27 30.47 0 24 0 14.64 0 6.61 5.38 2.68 13.22l7.98 6.19C12.47 13.09 17.77 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.38c-.54 2.9-2.16 5.36-4.6 7.04l7.07 5.49C43.91 37.15 46.1 31.32 46.1 24.5z" />
        <path fill="#FFAA00" d="M10.66 28.59A14.38 14.38 0 019.5 24c0-1.6.28-3.15.78-4.59l-7.98-6.19A23.93 23.93 0 000 24c0 3.86.93 7.5 2.32 10.78l8.34-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.91-2.13 15.88-5.81l-7.07-5.49c-1.96 1.31-4.47 2.09-8.81 2.09-6.23 0-11.53-3.59-13.34-8.81l-8.34 6.19C6.61 42.62 14.64 48 24 48z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
