"use client";

type MicrosoftButtonProps = {
  label?: string;
  disabled?: boolean;
};

export function MicrosoftButton({
  label = "Continue with Microsoft",
  disabled,
}: MicrosoftButtonProps) {
  function handleMicrosoftAuth() {
    if (disabled) return;
    window.location.href = "/api/auth/microsoft";
  }

  return (
    <button
      type="button"
      onClick={handleMicrosoftAuth}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 border border-border rounded-md py-2 transition text-foreground
        ${disabled ? "opacity-60 cursor-not-allowed bg-muted" : "hover:bg-accent hover:text-accent-foreground"}
        dark:text-white`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="2" width="9" height="9" fill="#F25022" />
        <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
        <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
        <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
