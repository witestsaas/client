"use client";

import { Loader2 } from "lucide-react";

export function PageLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#FFAA00]" />
    </div>
  );
}
