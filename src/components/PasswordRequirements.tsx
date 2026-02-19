"use client";

import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  showRequirements: boolean;
}

export function PasswordRequirements({
  password,
  showRequirements,
}: PasswordRequirementsProps) {
  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Contains an uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains a number",
      met: /[0-9]/.test(password),
    },
  ];

  const allMet = requirements.every((req) => req.met);

  if (!showRequirements || !password) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      <div className="text-xs font-semibold text-blue-900 mb-2">
        Password Requirements:
      </div>
      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs"
          >
            {req.met ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span
              className={
                req.met
                  ? "text-green-700"
                  : "text-red-700"
              }
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
      {allMet && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <p className="text-xs font-semibold text-green-700">
            ✓ Password meets all requirements
          </p>
        </div>
      )}
    </div>
  );
}
