"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BotIcon } from "lucide-react";

export interface ActivityData {
  id: string;
  type: "Comment" | "History";
  action?: string;
  content?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
}

interface ActivityItemProps {
  activity: ActivityData;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFieldChange(field: string, oldValue: string | null, newValue: string | null): React.ReactNode {
  const formatValue = (val: string | null) => {
    if (!val) return <span className="text-muted-foreground italic">None</span>;
    return <span className="font-medium text-[#FFAA00]">{val}</span>;
  };

  return (
    <span>
      changed <span className="font-medium">{field}</span> from {formatValue(oldValue)} to {formatValue(newValue)}
    </span>
  );
}

function formatAction(action: string, field?: string | null, newValue?: string | null, oldValue?: string | null): React.ReactNode {
  const highlight = (text: string) => (
    <span className="font-medium text-[#FFAA00]">{text}</span>
  );
  
  switch (action) {
    case "created":
      return <span>{highlight("created")} this test plan</span>;
    case "cloned":
      return (
        <span>
          {highlight("cloned")} from {newValue ? highlight(newValue) : "another plan"}
        </span>
      );
    case "test_cases_added":
      return (
        <span>
          {highlight("added")} {newValue ? highlight(newValue) : "test cases"}
        </span>
      );
    case "test_cases_removed":
      return (
        <span>
          {highlight("removed")} {newValue ? highlight(newValue) : "test cases"}
        </span>
      );
    case "triggered":
      return (
        <span>
          {highlight("triggered")} test run{newValue && <> for {highlight(newValue)}</>}
        </span>
      );
    case "run_triggered":
      return (
        <span>
          {highlight("started a test run")}
        </span>
      );
    case "started":
      return <span>{highlight("started")} {newValue || "execution"}</span>;
    case "finished":
      return (
        <span>
          {highlight("finished")} {newValue && <>— {highlight(newValue)}</>}
        </span>
      );
    case "stopped":
    case "canceled":
      return <span>{highlight("stopped")} the test run</span>;
    case "completed":
      return (
        <span>
          {highlight("completed")} {field && newValue && <>— {highlight(newValue)}</>}
        </span>
      );
    case "status_changed":
      return (
        <span>
          status changed from {oldValue ? highlight(oldValue) : "—"} to {newValue ? highlight(newValue) : "—"}
        </span>
      );
    default:
      return (
        <span>
          <span className="font-medium text-foreground">{action}</span>
          {newValue && <span className="text-[#FFAA00] font-medium"> {newValue}</span>}
        </span>
      );
  }
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const isComment = activity.type === "Comment";
  const isSystem = !activity.user;
  const userName = isSystem ? "System" : (activity.user?.name || activity.user?.email.split("@")[0] || "User");
  const userEmail = activity.user?.email || "";

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-4 rounded-xl transition-all duration-200",
        "hover:bg-muted/50",
        "border border-transparent hover:border-border"
      )}
    >
      {/* Avatar */}
      {isSystem ? (
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 ring-2 ring-border">
          <BotIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <Avatar className="h-9 w-9 ring-2 ring-gray-200 dark:ring-slate-700 shrink-0">
          <AvatarImage src={activity.user?.image || undefined} alt={userName} />
          <AvatarFallback className="bg-[#FFAA00] text-black text-xs font-semibold">
            {getInitials(activity.user?.name || null, userEmail)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-semibold text-sm",
            isSystem ? "text-gray-500 dark:text-slate-400" : "text-foreground"
          )}>
            {userName}
          </span>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatTimeAgo(activity.createdAt)}
          </span>
        </div>

        {/* Body */}
        {isComment ? (
          <div className="relative">
            <div
              className={cn(
                "text-sm text-foreground leading-relaxed p-3 rounded-lg",
                "bg-muted",
                "border border-border"
              )}
            >
              {activity.content}
            </div>
            {/* Comment tail */}
            <div
              className={cn(
                "absolute -left-1 top-3 w-2 h-2 rotate-45",
                "bg-muted",
                "border-l border-b border-border"
              )}
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {activity.field && activity.action === "updated" ? (
              formatFieldChange(activity.field, activity.oldValue || null, activity.newValue || null)
            ) : (
              <span>
                {formatAction(activity.action || "", activity.field, activity.newValue, activity.oldValue)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="h-16 w-full bg-gray-100 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}
