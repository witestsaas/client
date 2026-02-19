"use client";

import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  status: "online" | "idle" | "offline";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PresenceIndicator({
  status,
  showLabel = false,
  size = "md",
  className,
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusConfig = {
    online: {
      color: "bg-green-500",
      label: "Available",
      ringColor: "ring-green-500/30",
    },
    idle: {
      color: "bg-red-500",
      label: "Idle",
      ringColor: "ring-red-500/30",
    },
    offline: {
      color: "bg-gray-400",
      label: "Offline",
      ringColor: "ring-gray-400/30",
    },
  };

  const config = statusConfig[status];

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <div
            className={cn(
              sizeClasses[size],
              config.color,
              "rounded-full ring-2",
              config.ringColor,
              status === "online" && "animate-pulse"
            )}
          />
        </div>
        <span className="text-sm text-muted-foreground">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          sizeClasses[size],
          config.color,
          "rounded-full ring-2",
          config.ringColor,
          status === "online" && "animate-pulse"
        )}
      />
    </div>
  );
}
